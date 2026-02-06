// mcp-servers/shared/types.ts

export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
  handler: (input: any, context?: any) => Promise<any>;
}

export interface MCPServerConfig {
  name: string;
  port: number;
  agentType: string;
  tools: MCPToolDefinition[];
}

export interface ToolContext {
  conversationId?: string;
  userId?: string;
}
