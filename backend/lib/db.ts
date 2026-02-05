import { neon } from '@neondatabase/serverless';

export const sql = neon(process.env.DATABASE_URL!);

export async function saveMessage(conversationId: string, role: string, content: string, metadata: any = {}) {
    await sql`
    INSERT INTO messages (conversation_id, role, content, metadata)
    VALUES (${conversationId}, ${role}, ${content}, ${JSON.stringify(metadata)})
  `;
}

export async function getConversationHistory(conversationId: string) {
    return await sql`
    SELECT role, content, metadata
    FROM messages
    WHERE conversation_id = ${conversationId}
    ORDER BY created_at ASC
  `;
}
