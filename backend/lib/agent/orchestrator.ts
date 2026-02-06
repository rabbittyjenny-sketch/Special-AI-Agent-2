
import { getHotState, saveHotState, addMessageToState as addMessage } from '@/lib/state/redis-state';
import { getUserMemory, learnFromInteraction } from '@/lib/memory/memory-manager';
import { verifyResponse } from '@/lib/verification/verifier';
import { decideEscalation } from '@/lib/verification/escalation';
import Anthropic from '@anthropic-ai/sdk';
import { AgentMemory as UserMemory } from '@/lib/types';
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from 'path';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

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

// 🧠 Main processing function
export async function processAgentRequest(
  request: AgentRequest
): Promise<AgentResponse> {

  const startTime = Date.now();
  let retryCount = 0;

  // 1️⃣ Load state + memory
  let state = await getHotState(request.conversationId);
  if (!state) {
    // Create new conversation
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

  // 2️⃣ Add user message to state
  await addMessage(request.conversationId, {
    role: 'user',
    content: request.userMessage
  });

  // 3️⃣ Build memory-enhanced system prompt
  const systemPrompt = buildSmartPrompt(request.agentType, memory);

  // Setup MCP Connectivity (Tool Link)
  let mcpClient: Client | null = null;
  let anthropicTools: any[] = [];
  try {
    const serverPath = path.join(process.cwd(), 'mcp-servers', `${request.agentType}-agent`, 'server.ts');
    const transport = new StdioClientTransport({ command: "npx", args: ["tsx", serverPath] });
    mcpClient = new Client({ name: "orchestrator", version: "1.0.0" }, { capabilities: {} });
    await mcpClient.connect(transport);
    const toolsList = await mcpClient.listTools();
    anthropicTools = toolsList.tools.map(t => ({
      name: t.name,
      description: t.description,
      input_schema: t.inputSchema
    }));
  } catch (e) {
    console.warn("MCP Connection Failed (running without tools):", e);
  }

  // 4️⃣ Call Claude with context
  const contextWindow = state.messages.slice(-10); // Last 10 messages

  let assistantResponse: string = "";
  let confidence: number = 0;
  let verificationResult: any = { passed: false, confidence: 0, issues: [], warnings: [] };
  let escalationDecision: any = { shouldEscalate: false };

  // 🔄 Retry loop (max 2 attempts)
  while (retryCount < 2) {
    const claudeResponse = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2048,
      system: systemPrompt,
      tools: anthropicTools.length > 0 ? anthropicTools : undefined,
      messages: contextWindow.map(m => ({
        role: m.role as any,
        content: m.content
      })).concat([{
        role: 'user',
        content: request.userMessage
      }])
    });

    // Handle Tool Use (Simplified for robustness)
    if (claudeResponse.stop_reason === "tool_use" && mcpClient) {
      const toolUse = claudeResponse.content.find(c => c.type === "tool_use") as any;
      if (toolUse) {
        try {
          const toolResult = await mcpClient.callTool({ name: toolUse.name, arguments: toolUse.input });
          state.context = { ...state.context, [toolUse.name]: toolResult };
          // In a real loop we would feed this back, but for now we let verification catch it
          assistantResponse = `Used tool ${toolUse.name}. Result: ${JSON.stringify(toolResult).slice(0, 100)}...`;
        } catch (e) {
          assistantResponse = "Error executing tool.";
        }
      }
    } else {
      const textBlock = claudeResponse.content.find(c => c.type === "text") as any;
      assistantResponse = textBlock ? textBlock.text : "Processed.";
    }

    const tokensUsed = claudeResponse.usage.input_tokens + claudeResponse.usage.output_tokens;

    // Update token count
    state.metadata.tokensUsed += tokensUsed;

    // 5️⃣ Verify response
    verificationResult = await verifyResponse(
      request.agentType,
      assistantResponse,
      state.context,
      memory
    );

    confidence = verificationResult.confidence;

    // 6️⃣ Escalation decision
    escalationDecision = await decideEscalation(confidence, verificationResult.issues, memory);

    // 7️⃣ Auto-resolve logic (if implemented in escalation)
    // For now we break if passed or if we ran out of retries
    if (verificationResult.passed || retryCount >= 1) {
      break;
    }

    retryCount++;
    // If we loop back, we could append a user message saying "Please fix [issues]"
  }

  // 8️⃣ Save assistant message
  await addMessage(request.conversationId, {
    role: 'assistant',
    content: assistantResponse,
    metadata: {
      confidence,
      verified: verificationResult.passed,
      warnings: verificationResult.warnings
    }
  });

  // 🔟 Save final state
  await saveHotState(state);

  // 1️⃣1️⃣ Async: Learn from this interaction
  learnFromInteraction(request.userId, request.agentType, {
    userMessage: request.userMessage,
    assistantResponse,
    wasApproved: !escalationDecision.shouldEscalate,
    confidence
  }).catch(console.error);

  // 1️⃣2️⃣ Return response
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
    design: "You are an expert UI/UX designer creating professional design solutions.",
    analyst: "You are a senior data analyst providing accurate, data-driven insights.",
    coder: "You are an expert software engineer writing clean, production-ready code.",
    marketing: "You are a strategic marketing expert creating effective content."
  };

  let prompt = basePrompts[agentType] || "You are a helpful AI assistant.";

  // 🔥 Inject learned preferences
  if (memory.preferences) {
    prompt += `\n\nUser Preferences:`;
    if (memory.preferences.outputStyle) prompt += `\n- Output style: ${memory.preferences.outputStyle}`;
    if (memory.preferences.tone) prompt += `\n- Tone: ${memory.preferences.tone}`;
  }

  // 🔥 Inject high-confidence patterns
  const topPatterns = memory.patterns
    .filter(p => p.confidence > 0.75)
    .slice(0, 5);

  if (topPatterns.length > 0) {
    prompt += `\n\nLearned Patterns (follow these):`;
    topPatterns.forEach(p => {
      prompt += `\n- ${p.pattern}`;
    });
  }

  // 🔥 Add quality requirements
  prompt += `\n\nQuality Requirements:`;
  prompt += `\n- Be specific and cite sources when possible`;
  prompt += `\n- Flag any uncertainties explicitly`;

  return prompt;
}
