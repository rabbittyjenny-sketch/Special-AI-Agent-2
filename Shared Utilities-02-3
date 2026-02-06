// mcp-servers/shared/logger.ts

export function log(level: 'info' | 'warn' | 'error', message: string, meta?: any) {
  const timestamp = new Date().toISOString();
  console.log(JSON.stringify({
    timestamp,
    level,
    message,
    ...meta
  }));
}
