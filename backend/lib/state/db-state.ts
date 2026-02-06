
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and } from 'drizzle-orm';
import { conversations, messages } from '../../drizzle/schema';
import { getHotState } from './redis-state';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

// ✅ Sync hot state to DB (called by background worker)
export async function syncStateToDatabase(conversationId: string) {
    const hotState = await getHotState(conversationId);
    if (!hotState) return;

    // Upsert conversation record
    await db.insert(conversations).values({
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
        await db.insert(messages).values({
            conversationId: hotState.conversationId,
            role: msg.role as 'user' | 'assistant' | 'system' | 'tool',
            content: msg.content,
            metadata: msg.metadata || {},
            createdAt: new Date(msg.timestamp)
        }).onConflictDoNothing(); // Needs a unique constraint on ID if we have it in Message
    }
}
