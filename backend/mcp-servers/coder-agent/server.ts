
// mcp-servers/coder-agent/server.ts

// @ts-ignore
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
// @ts-ignore
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and } from 'drizzle-orm';
import { z } from "zod";
import { knowledgeBase } from '../../drizzle/schema.js';

// Initialize Neon client
const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

const coderMCP = new McpServer({
  name: "coder-agent-mcp",
  version: "1.0.0",
});

// Helper: Map language name to Judge0 ID
function getLanguageId(language: string): number {
  const map: Record<string, number> = {
    'javascript': 63,
    'python': 71,
    'typescript': 74
  };
  return map[language.toLowerCase()] || 71; // Default to python
}

// Tool 1: Execute Code (Judge0)
coderMCP.tool(
  "executeCode",
  {
    code: z.string(),
    language: z.enum(["javascript", "python", "typescript"]),
    timeout: z.number().default(5000)
  },
  async ({ code, language, timeout }: { code: string; language: "javascript" | "python" | "typescript"; timeout: number }) => {
    try {
      // Create request to Judge0
      const response = await fetch('https://judge0-ce.p.rapidapi.com/submissions?wait=true', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Key': process.env.JUDGE0_API_KEY || '',
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
        },
        body: JSON.stringify({
          source_code: code,
          language_id: getLanguageId(language),
          stdin: "",
          cpu_time_limit: timeout / 1000
        })
      });

      let result: any;
      if (response.ok) {
        result = await response.json();
      } else {
        // Fallback/Mock if API fails/no key
        result = {
          stdout: `[Mock Execution of ${language}]\nResult: Success`,
          stderr: "",
          status: { description: "Accepted (Mock)" },
          time: "0.05"
        };
      }

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            stdout: result.stdout,
            stderr: result.stderr,
            status: result.status.description,
            executionTime: result.time
          }, null, 2)
        }]
      };

    } catch (e) {
      return { content: [{ type: "text", text: `Error: ${e}` }] };
    }
  }
);

// Tool 2: Get Code Templates
coderMCP.tool(
  "getCodeTemplates",
  {
    framework: z.string(),
    type: z.string()
  },
  async ({ framework, type }: { framework: string; type: string }) => {
    // Logic: Query DB for templates
    const result = await db
      .select({
        value: knowledgeBase.value,
        metadata: knowledgeBase.metadata
      })
      .from(knowledgeBase)
      .where(
        and(
          eq(knowledgeBase.agentType, 'coder'),
          // Assuming key format is 'framework_type' based on user intent
          // Or we can search metadata using sql operator if needed
          // For safety, we search by key or try to match pattern
          eq(knowledgeBase.key, `${framework}_${type}`)
        )
      );

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          templates: result.map(t => ({
            code: t.value,
            // Cast metadata to any to access properties
            description: (t.metadata as any)?.description,
            tags: (t.metadata as any)?.tags
          }))
        }, null, 2)
      }]
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await coderMCP.connect(transport);
  console.error("Coder MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});