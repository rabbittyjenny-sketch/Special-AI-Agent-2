
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and } from 'drizzle-orm';
import { conversations, messages } from '../../drizzle/schema';
import { getHotState } from './redis-state';

// Lazy initialization to avoid build-time database connection
let sqlInstance: ReturnType<typeof neon> | null = null;
let dbInstance: ReturnType<typeof drizzle> | null = null;

const getSql = () => {
  if (!sqlInstance) {
    sqlInstance = neon(process.env.DATABASE_URL!);
  }
  return sqlInstance;
};

const getDb = () => {
  if (!dbInstance) {
    dbInstance = drizzle(getSql());
  }
  return dbInstance;
};

// ✅ Sync hot state to DB (called by background worker)
export async function syncStateToDatabase(conversationId: string) {
    const hotState = await getHotState(conversationId);
    if (!hotState) return;

    // Upsert conversation record
    await getDb().insert(conversations).values({
        id: hotState.conversationId,
        userId: hotState.userId,
        agentType: hotState.agentType as 'design' | 'analyst' | 'coder' | 'marketing',
        status: 'active',
        metadata: hotState.metadata,
        updatedAt: new Date()
    }).onConflictDoUpdate({
        target: conversations.id,
        set: {
            metadata: hotState.metadata,
            updatedAt: new Date()
        }
    });

    // Insert messages that aren't in DB yet
    // For simplicity, we sync the whole message list if needed or track via offset
    // Here we'll just batch insert new ones
    for (const msg of hotState.messages) {
        await getDb().insert(messages).values({
            conversationId: hotState.conversationId,
            role: msg.role as 'user' | 'assistant' | 'system' | 'tool',
            content: msg.content,
            metadata: msg.metadata || {},
            createdAt: new Date(msg.timestamp)
        }).onConflictDoNothing(); // Needs a unique constraint on ID if we have it in Message
    }
}
