
import { syncStateToDatabase } from '@/lib/state/db-state';
import { redis } from '@/lib/state/redis-state';

// Force dynamic rendering to avoid build-time database connection errors
export const dynamic = 'force-dynamic';

export async function GET() {
    const batchSize = 10;
    const processed = [];

    for (let i = 0; i < batchSize; i++) {
        const item = await redis.rpop('sync_queue');
        if (!item) break;

        try {
            const { conversationId } = JSON.parse(item);
            await syncStateToDatabase(conversationId);
            processed.push(conversationId);
        } catch (error) {
            console.error('Sync failed:', error);
            // Re-queue on error
            await redis.lpush('sync_queue', item);
        }
    }

    return Response.json({ success: true, processed });
}
