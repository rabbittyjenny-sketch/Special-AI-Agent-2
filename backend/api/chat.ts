import Anthropic from '@anthropic-ai/sdk';
import { sql, saveMessage, getConversationHistory } from '../lib/db';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const runtime = 'edge';

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { message, conversationId, userId } = await req.json();

    // 1. Logic to route to agent (Simplified for MVP: always Analyst for now)
    const agentType = 'analyst';

    // 2. Get history
    const history = await getConversationHistory(conversationId);

    // 3. Define Tools (Analyst tools)
    const tools: any[] = [
      {
        name: "query_google_sheets",
        description: "Fetch data from a Google Sheet",
        input_schema: {
          type: "object",
          properties: {
            sheetId: { type: "string" },
            range: { type: "string" },
          },
          required: ["sheetId", "range"],
        },
      },
      {
        name: "statistical_analysis",
        description: "Perform statistical analysis on numerical data",
        input_schema: {
          type: "object",
          properties: {
            data: { type: "array", items: { type: "number" } },
            method: {
              type: "string",
              enum: ["mean", "median", "stddev", "min", "max"]
            },
          },
          required: ["data", "method"],
        },
      }
    ];

    // 4. Initial call to Claude
    let response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 1024,
      tools: tools,
      messages: [
        ...history.map((h: any) => ({ role: h.role, content: h.content })),
        { role: "user", content: message }
      ],
    });

    // 5. Handle Tool Use (Recursive if needed, but simple loop for MVP)
    let finalContent = "";
    if (response.stop_reason === "tool_use") {
      // In a real scenario, this would call the MCP server.
      // For MVP simulation or direct call logic:
      const toolUse = response.content.find(c => c.type === "tool_use") as any;

      if (toolUse) {
        // Here we would normally fetch from MCP. 
        // For Mock/MVP we'll return a message about execution.
        const toolResult = `[Mock Result for ${toolUse.name}]`;

        const finalResponse = await anthropic.messages.create({
          model: "claude-3-5-sonnet-20240620",
          max_tokens: 1024,
          messages: [
            ...history.map((h: any) => ({ role: h.role, content: h.content })),
            { role: "user", content: message },
            { role: "assistant", content: response.content },
            {
              role: "user",
              content: [
                {
                  type: "tool_result",
                  tool_use_id: toolUse.id,
                  content: toolResult,
                },
              ],
            },
          ],
        });
        finalContent = (finalResponse.content[0] as any).text;
      }
    } else {
      finalContent = (response.content[0] as any).text;
    }

    // 6. Save Response
    await saveMessage(conversationId, 'assistant', finalContent, { agentType });

    return new Response(JSON.stringify({
      message: finalContent,
      agentType
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Chat API Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
