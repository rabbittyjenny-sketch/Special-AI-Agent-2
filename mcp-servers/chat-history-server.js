#!/usr/bin/env node

/**
 * Chat History MCP Server
 * Stores and retrieves chat conversations for AI agents
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const fs = require('fs').promises;
const path = require('path');

// Database file path
const DB_PATH = path.join(__dirname, '../data/chat-history.json');

// Ensure data directory exists
async function ensureDataDir() {
  const dataDir = path.dirname(DB_PATH);
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch (err) {
    console.error('Failed to create data directory:', err);
  }
}

// Load chat history from file
async function loadHistory() {
  try {
    await ensureDataDir();
    const data = await fs.readFile(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    // If file doesn't exist, return empty history
    return { conversations: {}, sessions: {} };
  }
}

// Save chat history to file
async function saveHistory(history) {
  try {
    await ensureDataDir();
    await fs.writeFile(DB_PATH, JSON.stringify(history, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save history:', err);
    throw err;
  }
}

// Create MCP Server
const server = new Server(
  {
    name: 'chat-history-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'save_message',
        description: 'Save a chat message to history',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'Unique session identifier',
            },
            agentType: {
              type: 'string',
              description: 'Type of agent (code-specialist, creative-director, data-strategist, growth-hacker)',
            },
            role: {
              type: 'string',
              enum: ['user', 'assistant'],
              description: 'Message role',
            },
            content: {
              type: 'string',
              description: 'Message content',
            },
            metadata: {
              type: 'object',
              description: 'Optional metadata',
            },
          },
          required: ['sessionId', 'agentType', 'role', 'content'],
        },
      },
      {
        name: 'get_session_history',
        description: 'Retrieve chat history for a session',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'Session identifier',
            },
          },
          required: ['sessionId'],
        },
      },
      {
        name: 'search_conversations',
        description: 'Search conversations by content or metadata',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query',
            },
            agentType: {
              type: 'string',
              description: 'Filter by agent type',
            },
            limit: {
              type: 'number',
              description: 'Maximum results (default: 10)',
            },
          },
          required: ['query'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'save_message': {
        const history = await loadHistory();
        const { sessionId, agentType, role, content, metadata } = args;

        // Initialize session if it doesn't exist
        if (!history.sessions[sessionId]) {
          history.sessions[sessionId] = {
            id: sessionId,
            agentType,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            messages: [],
          };
        }

        // Add message
        const message = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          role,
          content,
          timestamp: new Date().toISOString(),
          metadata: metadata || {},
        };

        history.sessions[sessionId].messages.push(message);
        history.sessions[sessionId].updatedAt = new Date().toISOString();

        await saveHistory(history);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, messageId: message.id }),
            },
          ],
        };
      }

      case 'get_session_history': {
        const history = await loadHistory();
        const { sessionId } = args;

        const session = history.sessions[sessionId];

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                session || { error: 'Session not found', messages: [] }
              ),
            },
          ],
        };
      }

      case 'search_conversations': {
        const history = await loadHistory();
        const { query, agentType, limit = 10 } = args;

        // Simple search implementation
        const results = [];
        const queryLower = query.toLowerCase();

        for (const [sessionId, session] of Object.entries(history.sessions)) {
          // Filter by agent type if specified
          if (agentType && session.agentType !== agentType) continue;

          // Search in messages
          const matchingMessages = session.messages.filter((msg) =>
            msg.content.toLowerCase().includes(queryLower)
          );

          if (matchingMessages.length > 0) {
            results.push({
              sessionId,
              agentType: session.agentType,
              matchCount: matchingMessages.length,
              messages: matchingMessages.slice(0, 3), // Preview only
            });
          }

          if (results.length >= limit) break;
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ results, total: results.length }),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: error.message }),
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Chat History MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
