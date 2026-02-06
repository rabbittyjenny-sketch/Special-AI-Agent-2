// mcp-servers/shared/database.ts

import { neon } from '@neondatabase/serverless';

export const sql = neon(process.env.DATABASE_URL!);

export async function queryKnowledgeBase(
  agentType: string,
  category: string,
  key?: string
) {
  let query = sql`
    SELECT id, key, value, metadata
    FROM knowledge_base
    WHERE agent_type = ${agentType}
    AND category = ${category}
    AND is_active = true
  `;
  
  if (key) {
    query = sql`
      SELECT id, key, value, metadata
      FROM knowledge_base
      WHERE agent_type = ${agentType}
      AND category = ${category}
      AND key = ${key}
      AND is_active = true
    `;
  }
  
  const results = await query;
  return results;
}

export async function logToolCall(
  conversationId: string,
  agentType: string,
  toolName: string,
  input: any,
  output: any,
  status: 'success' | 'failed',
  executionTime: number,
  errorMessage?: string
) {
  await sql`
    INSERT INTO mcp_tool_calls (
      conversation_id,
      agent_type,
      tool_name,
      input_params,
      output_result,
      status,
      execution_time_ms,
      error_message,
      created_at
    ) VALUES (
      ${conversationId},
      ${agentType},
      ${toolName},
      ${JSON.stringify(input)},
      ${JSON.stringify(output)},
      ${status},
      ${executionTime},
      ${errorMessage || null},
      NOW()
    )
  `;
}
