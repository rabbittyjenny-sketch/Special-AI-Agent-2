
import { getHotState, saveHotState, addMessageToState as addMessage } from '@/lib/state/redis-state';
import { getUserMemory, learnFromInteraction } from '@/lib/memory/memory-manager';
import { verifyResponse } from '@/lib/verification/verifier';
import { decideEscalation } from '@/lib/verification/escalation';
import Anthropic from '@anthropic-ai/sdk';
import { AgentMemory as UserMemory, VerificationResult } from '@/lib/types';
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from 'path';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// Resolve MCP server path relative to backend root (not process.cwd())
const BACKEND_ROOT = path.resolve(__dirname, '../..');
const MCP_SERVERS_DIR = path.join(BACKEND_ROOT, 'mcp-servers');

export interface AgentRequest {
  conversationId: string;
  userId: string;
  agentType: string;
  userMessage: string;
}

export interface AgentResponse {
  message: string;
  confidence: number;
  verified: boolean;
  escalated: boolean;
  escalationReason?: string;
  warnings: string[];
  metadata: {
    tokensUsed: number;
    processingTime: number;
    retryCount: number;
  };
}

export async function processAgentRequest(
  request: AgentRequest
): Promise<AgentResponse> {

  const startTime = Date.now();
  let retryCount = 0;

  // 1. Load state + memory
  let state = await getHotState(request.conversationId);
  if (!state) {
    state = {
      conversationId: request.conversationId,
      userId: request.userId,
      agentType: request.agentType,
      messages: [],
      context: {},
      metadata: {
        startedAt: new Date().toISOString(),
        lastMessageAt: new Date().toISOString(),
        messageCount: 0,
        tokensUsed: 0
      }
    };
  }

  const memory = await getUserMemory(request.userId, request.agentType);

  // 2. Add user message to state
  await addMessage(request.conversationId, {
    role: 'user',
    content: request.userMessage
  });

  // 3. Build memory-enhanced system prompt
  const systemPrompt = buildSmartPrompt(request.agentType, memory);

  // 4. Setup MCP Connectivity
  let mcpClient: Client | null = null;
  let mcpTransport: StdioClientTransport | null = null;
  let anthropicTools: Anthropic.Tool[] = [];

  try {
    const serverPath = path.join(MCP_SERVERS_DIR, `${request.agentType}-agent`, 'server.ts');
    mcpTransport = new StdioClientTransport({ command: "npx", args: ["tsx", serverPath] });
    mcpClient = new Client({ name: "orchestrator", version: "1.0.0" }, { capabilities: {} });
    await mcpClient.connect(mcpTransport);
    const toolsList = await mcpClient.listTools();
    anthropicTools = toolsList.tools.map(t => ({
      name: t.name,
      description: t.description || "",
      input_schema: t.inputSchema as Anthropic.Tool["input_schema"]
    }));
  } catch (e) {
    console.warn("MCP Connection Failed (running without tools):", e);
  }

  // 5. Call Claude with context
  const contextWindow = state.messages.slice(-10);

  let assistantResponse: string = "";
  let confidence: number = 0;
  let verificationResult: VerificationResult = { passed: false, confidence: 0, issues: [], warnings: [], shouldEscalate: false };
  let escalationDecision: { shouldEscalate: boolean; reason?: string } = { shouldEscalate: false };

  try {
    // Retry loop (max 2 attempts)
    while (retryCount < 2) {
      const messages: Anthropic.MessageParam[] = [
        ...contextWindow.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content
        })),
        { role: 'user' as const, content: request.userMessage }
      ];

      const claudeResponse = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2048,
        system: systemPrompt,
        tools: anthropicTools.length > 0 ? anthropicTools : undefined,
        messages
      });

      // Handle Tool Use - feed result back to Claude
      if (claudeResponse.stop_reason === "tool_use" && mcpClient) {
        const toolUse = claudeResponse.content.find(c => c.type === "tool_use");
        if (toolUse && toolUse.type === "tool_use") {
          let toolResultContent: string;
          try {
            const toolResult = await mcpClient.callTool({ name: toolUse.name, arguments: toolUse.input as Record<string, unknown> });
            toolResultContent = JSON.stringify(toolResult.content);
            state.context = { ...state.context, [toolUse.name]: toolResult };
          } catch (e) {
            toolResultContent = `Error executing tool: ${e}`;
          }

          // Feed tool result back to Claude for a proper response
          const followUp = await anthropic.messages.create({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 2048,
            system: systemPrompt,
            tools: anthropicTools,
            messages: [
              ...messages,
              { role: 'assistant', content: claudeResponse.content },
              {
                role: 'user', content: [{
                  type: 'tool_result',
                  tool_use_id: toolUse.id,
                  content: toolResultContent
                }]
              }
            ]
          });

          const textBlock = followUp.content.find(c => c.type === "text");
          assistantResponse = textBlock && textBlock.type === "text" ? textBlock.text : toolResultContent;
          state.metadata.tokensUsed += followUp.usage.input_tokens + followUp.usage.output_tokens;
        }
      } else {
        const textBlock = claudeResponse.content.find(c => c.type === "text");
        assistantResponse = textBlock && textBlock.type === "text" ? textBlock.text : "Processed.";
      }

      const tokensUsed = claudeResponse.usage.input_tokens + claudeResponse.usage.output_tokens;
      state.metadata.tokensUsed += tokensUsed;

      // 6. Verify response
      verificationResult = await verifyResponse(
        request.agentType,
        assistantResponse,
        state.context,
        memory
      );

      confidence = verificationResult.confidence;

      // 7. Escalation decision
      escalationDecision = await decideEscalation(confidence, verificationResult.issues, memory);

      if (verificationResult.passed || retryCount >= 1) {
        break;
      }

      retryCount++;
    }
  } finally {
    // Cleanup MCP process to prevent zombie processes
    if (mcpClient) {
      try { await mcpClient.close(); } catch { /* ignore cleanup errors */ }
    }
  }

  // 8. Save assistant message
  await addMessage(request.conversationId, {
    role: 'assistant',
    content: assistantResponse,
    metadata: {
      confidence,
      verified: verificationResult.passed,
      warnings: verificationResult.warnings
    }
  });

  // 9. Save final state
  await saveHotState(state);

  // 10. Async: Learn from this interaction
  learnFromInteraction(request.userId, request.agentType, {
    userMessage: request.userMessage,
    assistantResponse,
    wasApproved: !escalationDecision.shouldEscalate,
    confidence
  }).catch(console.error);

  // 11. Return response
  return {
    message: assistantResponse,
    confidence,
    verified: verificationResult.passed,
    escalated: escalationDecision.shouldEscalate,
    escalationReason: escalationDecision.reason,
    warnings: verificationResult.warnings,
    metadata: {
      tokensUsed: state.metadata.tokensUsed,
      processingTime: Date.now() - startTime,
      retryCount
    }
  };
}

// Build smart prompt with memory
function buildSmartPrompt(agentType: string, memory: UserMemory): string {
  const basePrompts: Record<string, string> = {
    design: `คุณคือ Senior Creative Director และ UI/UX Expert ระดับโลก
- สไตล์การทำงาน: เน้นความหรูหรา (Premium), ทันสมัย (Modern), และใช้งานได้จริง (Usability)
- การนำเสนอ: ให้เหตุผลด้านจิตวิทยาคู่กับความสวยงามเสมอ
- ภาษา: พูดคุยอย่างเป็นมืออาชีพแต่เป็นกันเอง ชอบใช้ศัพท์เทคนิคควบคู่กับคำอธิบายภาษาไทยที่เข้าใจง่าย`,

    analyst: `คุณคือ Lead Data Scientist และที่ปรึกษาวางแผนกลยุทธ์
- สไตล์การทำงาน: เชื่อถือข้อมูล (Data-Driven), มองหาความเสี่ยง (Risk Assessment), และความคุ้มค่า (ROI)
- การนำเสนอ: นำเสนอในรูปแบบสรุปใจความสำคัญ (Bullet points) และตารางเปรียบเทียบ
- ภาษา: ตรงไปตรงมา แม่นยำ และมีความเป็นวิชาการที่ประยุกต์ใช้ได้จริง`,

    coder: `คุณคือ Full-Stack Software Architect และ AI Automation Expert
- สไตล์การทำงาน: เขียน Code ที่ Clean, Scalable และคำนึงถึง Security เป็นอันดับหนึ่ง
- การนำเสนอ: เน้นการอธิบาย Logic และขั้นตอนการทำงาน (Workflow) อย่างเป็นลำดับ
- ภาษา: สั้น กระชับ เน้นผลลัพธ์ (Solution-oriented)`,

    marketing: `คุณคือ Strategic Marketing Manager และ Content Creator มืออาชีพ
- สไตล์การทำงาน: เน้นการสร้างยอดขาย (Conversion), การเล่าเรื่อง (Storytelling), และการสร้างแบรนด์ (Branding)
- การนำเสนอ: มีความครีเอทีฟ มีพลัง (Energetic) และมักจะให้ตัวเลือกที่น่าสนใจเสมอ
- ภาษา: ใช้ภาษาที่ดึงดูดใจ (Copywriting execution) และเข้าใจพฤติกรรมผู้บริโภคไทยอย่างลึกซึ้ง`
  };

  let prompt = basePrompts[agentType] || "คุณคือผู้ช่วย AI อัจฉริยะที่พร้อมช่วยเหลือในทุกด้าน";

  // เพิ่ม Global Logic (Smart Lazy Style)
  prompt += `\n\n📌 หลักการทำงาน (Smart Lazy Style):
- วิเคราะห์ความต้องการลึกซึ้งก่อนตอบ
- เน้นทางลัดที่ได้ผลลัพธ์สูงสุด (80/20 Rule)
- หากข้อมูลไม่เพียงพอ ให้ถามคำถามที่ตรงจุดทันที
- สื่อสารเป็นภาษาไทยเป็นหลัก (ยกเว้นศัพท์เทคนิค)`;

  if (memory.preferences) {
    prompt += `\n\n👤 ความจำเกี่ยวกับผู้ใช้ (User Memory):`;
    if (memory.preferences.outputStyle) prompt += `\n- รูปแบบการตอบที่คุณชอบ: ${memory.preferences.outputStyle}`;
    if (memory.preferences.tone) prompt += `\n- ระดับภาษาที่ใช้: ${memory.preferences.tone}`;
  }

  const topPatterns = memory.patterns
    .filter(p => p.confidence > 0.75)
    .slice(0, 5);

  if (topPatterns.length > 0) {
    prompt += `\n\n🧠 รูปแบบที่เรียนรู้ได้จากคุณ:`;
    topPatterns.forEach(p => {
      prompt += `\n- ${p.pattern}`;
    });
  }

  prompt += `\n\n✅ มาตรฐานคุณภาพ:
- ข้อมูลต้องถูกต้องและผ่านการตรวจสอบ (Self-verified)
- หากมีส่วนที่ไม่แน่ใจ ให้แจ้งเตือนอย่างชัดเจน`;

  return prompt;
}
