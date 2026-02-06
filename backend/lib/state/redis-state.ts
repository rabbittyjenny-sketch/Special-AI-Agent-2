
import { Redis } from '@upstash/redis';
import { Message } from '../types.js';

export const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export interface ConversationContext {
    currentTask?: string;
    workingData?: any;
    escalationHistory?: Array<{
        timestamp: string;
        reason: string;
        resolved: boolean;
    }>;
    userPreferences?: {
        outputStyle?: 'concise' | 'detailed';
        tone?: 'professional' | 'casual';
        autoApprove?: boolean;
    };
}

export interface HotState {
    conversationId: string;
    userId: string;
    agentType: string;
    messages: Message[];
    context: ConversationContext;
    metadata: {
        startedAt: string;
        lastMessageAt: string;
        messageCount: number;
        tokensUsed: number;
    };
}

// ✅ Get hot state (with smart caching)
export async function getHotState(conversationId: string): Promise<HotState | null> {
    const cached = await redis.get<HotState>(`conv:${conversationId}`);
    return cached;
}

// ✅ Save hot state (with TTL 1 hour)
export async function saveHotState(state: HotState, ttl: number = 3600) {
    const key = `conv:${state.conversationId}`;
    state.metadata.lastMessageAt = new Date().toISOString();
    state.metadata.messageCount = state.messages.length;

    await redis.setex(key, ttl, state);

    // 🔥 Queue for DB sync (background job)
    await queueDBSync(state.conversationId);
}

// ✅ Add message (atomic operation)
export async function addMessageToState(
    conversationId: string,
    message: Omit<Message, 'timestamp'>
): Promise<void> {
    let state = await getHotState(conversationId);

    if (!state) {
        // Initial state if not found (should be handled by orchestrator)
        return;
    }

    const newMessage: Message = {
        ...message,
        timestamp: new Date().toISOString()
    };

    state.messages.push(newMessage);
    await saveHotState(state);
}

// 🔥 Queue DB sync
async function queueDBSync(conversationId: string) {
    await redis.lpush('sync_queue', JSON.stringify({
        conversationId,
        timestamp: new Date().toISOString()
    }));
}
