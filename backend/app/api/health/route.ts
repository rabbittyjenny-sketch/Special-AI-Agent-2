import { neon } from '@neondatabase/serverless';

export async function GET() {
    try {
        const sql = neon(process.env.DATABASE_URL!);
        await sql`SELECT 1`;
        return Response.json({ status: 'ok', database: 'connected' });
    } catch (error: any) {
        return Response.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
