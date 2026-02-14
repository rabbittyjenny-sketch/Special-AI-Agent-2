/**
 * Database Persistence Layer
 * Provides fallback storage when Redis expires
 * Stores conversations and messages in PostgreSQL (Neon)
 */

import { neon } from '@neondatabase/serverless';
import { HotState, ConversationContext } from './redis-state';
import { Message } from '../types';

const sql = neon(process.env.DATABASE_URL!);

/**
 * Persist conversation to database
 * Upserts conversation record and stores new messages
 */
export async function persistConversationToDB(state: HotState): Promise<void> {
  try {
    // 1. Upsert conversation record
    await sql`
      INSERT INTO conversations (id, user_id, agent_type, metadata, created_at, updated_at)
      VALUES (
        ${state.conversationId},
        ${state.userId}::uuid,
        ${state.agentType}::agent_type,
        ${JSON.stringify(state.metadata)},
        ${state.metadata.startedAt},
        ${state.metadata.lastMessageAt}
      )
      ON CONFLICT (id)
      DO UPDATE SET
        metadata = EXCLUDED.metadata,
        updated_at = EXCLUDED.updated_at
    `;

    // 2. Get existing message IDs to avoid duplicates
    const existingMessages = await sql`
      SELECT content, created_at
      FROM messages
      WHERE conversation_id = ${state.conversationId}
      ORDER BY created_at ASC
    `;

    const existingSet = new Set(
      existingMessages.map((m: any) => `${m.content}_${m.created_at}`)
    );

    // 3. Insert only new messages
    const newMessages = state.messages.filter((msg) => {
      const key = `${msg.content}_${msg.timestamp}`;
      return !existingSet.has(key);
    });

    if (newMessages.length > 0) {
      // Batch insert new messages
      for (const msg of newMessages) {
        await sql`
          INSERT INTO messages (conversation_id, role, content, metadata, created_at)
          VALUES (
            ${state.conversationId},
            ${msg.role}::message_role,
            ${msg.content},
            ${JSON.stringify(msg.metadata || {})},
            ${msg.timestamp}
          )
        `;
      }

      console.log(`💾 Persisted ${newMessages.length} new messages to DB for conversation ${state.conversationId}`);
    }

  } catch (error) {
    console.error('Failed to persist conversation to DB:', error);
    // Don't throw - persistence failure shouldn't break the app
  }
}

/**
 * Load conversation from database
 * Returns full conversation state or null if not found
 */
export async function loadConversationFromDB(conversationId: string): Promise<HotState | null> {
  try {
    // 1. Load conversation metadata
    const conversations = await sql`
      SELECT id, user_id, agent_type, metadata, created_at, updated_at
      FROM conversations
      WHERE id = ${conversationId}
      LIMIT 1
    `;

    if (conversations.length === 0) {
      console.log(`📭 No conversation found in DB: ${conversationId}`);
      return null;
    }

    const conv = conversations[0];

    // 2. Load all messages for this conversation
    const messagesResult = await sql`
      SELECT role, content, metadata, created_at as timestamp
      FROM messages
      WHERE conversation_id = ${conversationId}
      ORDER BY created_at ASC
    `;

    const messages: Message[] = messagesResult.map((row: any) => ({
      role: row.role as 'user' | 'assistant',
      content: row.content,
      metadata: row.metadata || {},
      timestamp: row.timestamp,
      // Note: attachments are stored separately and fetched on demand
    }));

    // 3. Reconstruct HotState
    const state: HotState = {
      conversationId: conv.id,
      userId: conv.user_id,
      agentType: conv.agent_type,
      messages,
      context: (conv.metadata as any)?.context || {},
      metadata: conv.metadata || {
        startedAt: conv.created_at,
        lastMessageAt: conv.updated_at,
        messageCount: messages.length,
        tokensUsed: 0,
      },
    };

    console.log(`📖 Loaded conversation from DB: ${conversationId} (${messages.length} messages)`);
    return state;

  } catch (error) {
    console.error('Failed to load conversation from DB:', error);
    return null;
  }
}

/**
 * Get recent conversations for a user
 * Useful for conversation history UI
 */
export async function getRecentConversations(
  userId: string,
  limit: number = 10
): Promise<Array<{
  id: string;
  agentType: string;
  title?: string;
  lastMessage: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}>> {
  try {
    const result = await sql`
      SELECT
        c.id,
        c.agent_type,
        c.metadata->>'title' as title,
        c.created_at,
        c.updated_at,
        (
          SELECT COUNT(*)
          FROM messages m
          WHERE m.conversation_id = c.id
        ) as message_count,
        (
          SELECT content
          FROM messages m
          WHERE m.conversation_id = c.id
          ORDER BY m.created_at DESC
          LIMIT 1
        ) as last_message
      FROM conversations c
      WHERE c.user_id = ${userId}::uuid
      ORDER BY c.updated_at DESC
      LIMIT ${limit}
    `;

    return result.map((row: any) => ({
      id: row.id,
      agentType: row.agent_type,
      title: row.title,
      lastMessage: row.last_message || '',
      messageCount: Number(row.message_count) || 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

  } catch (error) {
    console.error('Failed to get recent conversations:', error);
    return [];
  }
}

/**
 * Delete old conversations from database
 * Useful for cleanup/privacy
 */
export async function deleteOldConversations(
  olderThanDays: number
): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await sql`
      DELETE FROM conversations
      WHERE updated_at < ${cutoffDate.toISOString()}
      RETURNING id
    `;

    console.log(`🗑️  Deleted ${result.length} conversations older than ${olderThanDays} days`);
    return result.length;

  } catch (error) {
    console.error('Failed to delete old conversations:', error);
    return 0;
  }
}

/**
 * Get conversation statistics
 */
export async function getConversationStats(conversationId: string): Promise<{
  messageCount: number;
  totalTokens: number;
  duration: number; // in seconds
  agentType: string;
}> {
  try {
    const result = await sql`
      SELECT
        c.agent_type,
        COUNT(m.id) as message_count,
        COALESCE(SUM((m.metadata->>'tokensUsed')::int), 0) as total_tokens,
        EXTRACT(EPOCH FROM (c.updated_at - c.created_at)) as duration
      FROM conversations c
      LEFT JOIN messages m ON m.conversation_id = c.id
      WHERE c.id = ${conversationId}
      GROUP BY c.id, c.agent_type, c.updated_at, c.created_at
    `;

    if (result.length === 0) {
      return {
        messageCount: 0,
        totalTokens: 0,
        duration: 0,
        agentType: 'unknown',
      };
    }

    const row = result[0];
    return {
      messageCount: Number(row.message_count) || 0,
      totalTokens: Number(row.total_tokens) || 0,
      duration: Number(row.duration) || 0,
      agentType: row.agent_type,
    };

  } catch (error) {
    console.error('Failed to get conversation stats:', error);
    return {
      messageCount: 0,
      totalTokens: 0,
      duration: 0,
      agentType: 'unknown',
    };
  }
}
