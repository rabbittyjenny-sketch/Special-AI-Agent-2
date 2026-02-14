#!/usr/bin/env node

/**
 * Filesystem MCP Server
 * Provides file read/write capabilities for AI agents
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const fs = require('fs').promises;
const path = require('path');

// Allowed directories (configurable via env)
const ALLOWED_DIRS = (process.env.ALLOWED_DIRECTORIES || './backend')
  .split(',')
  .map((dir) => path.resolve(dir.trim()));

// Check if path is within allowed directories
function isPathAllowed(filePath) {
  const resolvedPath = path.resolve(filePath);
  return ALLOWED_DIRS.some((allowedDir) =>
    resolvedPath.startsWith(allowedDir)
  );
}

// Create MCP Server
const server = new Server(
  {
    name: 'filesystem-server',
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
        name: 'read_file',
        description: 'Read contents of a file',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'File path to read',
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'write_file',
        description: 'Write content to a file',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'File path to write',
            },
            content: {
              type: 'string',
              description: 'Content to write',
            },
          },
          required: ['path', 'content'],
        },
      },
      {
        name: 'list_directory',
        description: 'List files in a directory',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Directory path',
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'search_files',
        description: 'Search for files by pattern',
        inputSchema: {
          type: 'object',
          properties: {
            pattern: {
              type: 'string',
              description: 'Search pattern (glob)',
            },
            directory: {
              type: 'string',
              description: 'Directory to search in',
            },
          },
          required: ['pattern', 'directory'],
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
      case 'read_file': {
        const { path: filePath } = args;

        if (!isPathAllowed(filePath)) {
          throw new Error('Access denied: Path is outside allowed directories');
        }

        const content = await fs.readFile(filePath, 'utf8');

        return {
          content: [
            {
              type: 'text',
              text: content,
            },
          ],
        };
      }

      case 'write_file': {
        const { path: filePath, content } = args;

        if (!isPathAllowed(filePath)) {
          throw new Error('Access denied: Path is outside allowed directories');
        }

        // Ensure directory exists
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, content, 'utf8');

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, path: filePath }),
            },
          ],
        };
      }

      case 'list_directory': {
        const { path: dirPath } = args;

        if (!isPathAllowed(dirPath)) {
          throw new Error('Access denied: Path is outside allowed directories');
        }

        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        const files = entries.map((entry) => ({
          name: entry.name,
          type: entry.isDirectory() ? 'directory' : 'file',
          path: path.join(dirPath, entry.name),
        }));

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(files, null, 2),
            },
          ],
        };
      }

      case 'search_files': {
        const { pattern, directory } = args;

        if (!isPathAllowed(directory)) {
          throw new Error('Access denied: Path is outside allowed directories');
        }

        // Simple pattern matching (could be enhanced with glob library)
        const results = [];

        async function searchDir(dir) {
          const entries = await fs.readdir(dir, { withFileTypes: true });

          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
              // Skip node_modules and .git
              if (entry.name !== 'node_modules' && entry.name !== '.git') {
                await searchDir(fullPath);
              }
            } else if (entry.name.includes(pattern)) {
              results.push(fullPath);
            }
          }
        }

        await searchDir(directory);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ files: results, total: results.length }),
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
  console.error('Filesystem MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
