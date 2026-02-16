
import { redis } from '@/lib/state/redis-state';
import { neon } from '@neondatabase/serverless';

// Force dynamic rendering to avoid build-time database connection errors
export const dynamic = 'force-dynamic';

export async function GET() {
    const status: any = {
        timestamp: new Date().toISOString(),
        services: {
            redis: 'down',
            database: 'down',
            anthropic: 'unknown'
        }
    };

    try {
        await redis.ping();
        status.services.redis = 'up';
    } catch (e) { }

    try {
        const sql = neon(process.env.DATABASE_URL!);
        await sql`SELECT 1`;
        status.services.database = 'up';
    } catch (e) { }

    const allUp = Object.values(status.services).every(s => s === 'up' || s === 'unknown');

    return Response.json({
        status: allUp ? 'healthy' : 'degraded',
        ...status
    });
}
