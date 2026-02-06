// lib/agent/mcp-client.ts

export async function callMCPTool(
  agentType: string,
  toolName: string,
  input: any,
  context?: any
) {
  const mcpPorts: Record<string, number> = {
    design: 3001,
    analyst: 3002,
    coder: 3003,
    marketing: 3004
  };
  
  const port = mcpPorts[agentType];
  const baseUrl = process.env.NODE_ENV === 'production'
    ? `https://${agentType}-mcp.railway.app` // Production URL
    : `http://localhost:${port}`; // Local development
  
  try {
    const response = await fetch(`${baseUrl}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool: toolName, input, context })
    });
    
    if (!response.ok) {
      throw new Error(`MCP call failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.result;
    
  } catch (error: any) {
    console.error(`MCP call error (${agentType}/${toolName}):`, error);
    throw error;
  }
}
