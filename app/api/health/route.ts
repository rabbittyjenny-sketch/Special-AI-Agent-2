export async function GET() {
  const checks = {
    database: !!process.env.DATABASE_URL,
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    redis: !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN
  };
  
  return Response.json({
    status: Object.values(checks).every(v => v) ? 'healthy' : 'unhealthy',
    checks
  });
}
