📊 MCP Overview Diagram
┌─────────────────────────────────────────────────────┐
│                 Vercel (Orchestrator)               │
│  ┌──────────────────────────────────────────────┐  │
│  │  Agent Brain                                  │  │
│  │  - Receives user request                     │  │
│  │  - Calls Claude API                          │  │
│  │  - Claude returns tool_use                   │  │
│  │  - Forward to appropriate MCP Server         │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                       ↓ HTTP Request
        ┌──────────────┼──────────────┐
        ↓              ↓              ↓              ↓
┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│ Design MCP    │ │ Analyst MCP   │ │ Coder MCP     │ │ Marketing MCP │
│ Port: 3001    │ │ Port: 3002    │ │ Port: 3003    │ │ Port: 3004    │
│               │ │               │ │               │ │               │
│ Tools:        │ │ Tools:        │ │ Tools:        │ │ Tools:        │
│ - Figma API   │ │ - Sheets API  │ │ - GitHub API  │ │ - Analytics   │
│ - Canva API   │ │ - SQL Query   │ │ - Code Exec   │ │ - SEO Tools   │
│ - KB Query    │ │ - Charts      │ │ - KB Query    │ │ - KB Query    │
└───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘
        ↓              ↓              ↓              ↓
┌─────────────────────────────────────────────────────┐
│            Neon Database (Knowledge Base)           │
│  - Design principles, templates, brand guidelines   │
│  - Code snippets, best practices                    │
│  - Marketing templates, content strategies          │
│  - Data analysis templates                          │
└─────────────────────────────────────────────────────┘


📂 Complete File Structure
/mcp-servers
  ├── package.json              # Shared dependencies
  ├── tsconfig.json             # TypeScript config
  ├── .env.example              # Environment template
  │
  ├── /shared                   # Shared utilities
  │   ├── database.ts           # Neon DB connection
  │   ├── types.ts              # Common types
  │   └── logger.ts             # Logging utility
  │
  ├── /design-agent             # Port 3001
  │   ├── server.ts             # Main server
  │   ├── tools/
  │   │   ├── figma.ts          # 🔌 Need Figma API key
  │   │   ├── canva.ts          # 🔌 Need Canva API key
  │   │   └── knowledge-base.ts # ✅ Auto (uses Neon)
  │   └── package.json
  │
  ├── /analyst-agent            # Port 3002
  │   ├── server.ts
  │   ├── tools/
  │   │   ├── google-sheets.ts  # 🔌 Need Google OAuth
  │   │   ├── sql-query.ts      # ✅ Auto (uses Neon)
  │   │   ├── charts.ts         # ✅ Auto (Chart.js)
  │   │   └── statistics.ts     # ✅ Auto (simple-statistics)
  │   └── package.json
  │
  ├── /coder-agent              # Port 3003
  │   ├── server.ts
  │   ├── tools/
  │   │   ├── github.ts         # 🔌 Need GitHub token
  │   │   ├── code-executor.ts  # 🔌 Need Judge0 API (optional)
  │   │   ├── npm-search.ts     # ✅ Auto (npmjs API)
  │   │   └── knowledge-base.ts # ✅ Auto (uses Neon)
  │   └── package.json
  │
  └── /marketing-agent          # Port 3004
      ├── server.ts
      ├── tools/
      │   ├── seo-analyzer.ts   # ✅ Auto (built-in)
      │   ├── content-gen.ts    # ✅ Auto (uses Claude)
      │   ├── analytics.ts      # 🔌 Need GA4 API (optional)
      │   └── knowledge-base.ts # ✅ Auto (uses Neon)
      └── package.json

** Legend:**
✅ Auto = ใช้งานได้ทันที ไม่ต้องเชื่อม API
🔌 Need API = ต้องมี API key (optional, ไม่มีก็ยังทำงานได้)





🔧 Setup Instructions
1. Install Dependencies
# Root MCP folder
cd mcp-servers
npm init -y
npm install express cors dotenv
npm install @neondatabase/serverless
npm install -D typescript @types/express @types/node @types/cors tsx nodemon

# Individual servers (ถ้าต้องการแยก)
# cd design-agent && npm install
# cd analyst-agent && npm install
# etc.


2. Environment Variables
# mcp-servers/.env

# Database (Required)
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# Design Agent APIs (Optional)
FIGMA_ACCESS_TOKEN=your_figma_token_here
CANVA_API_KEY=your_canva_key_here

# Analyst Agent APIs (Optional)
GOOGLE_SHEETS_CLIENT_ID=your_google_client_id
GOOGLE_SHEETS_CLIENT_SECRET=your_google_secret
GOOGLE_SHEETS_REFRESH_TOKEN=your_refresh_token

# Coder Agent APIs (Optional)
GITHUB_TOKEN=your_github_personal_access_token
JUDGE0_API_KEY=your_judge0_key  # For code execution

# Marketing Agent APIs (Optional)
GOOGLE_ANALYTICS_PROPERTY_ID=your_ga4_property_id
GOOGLE_ANALYTICS_CREDENTIALS={"type":"service_account",...}

# MCP Server Ports (Default)
DESIGN_MCP_PORT=3001
ANALYST_MCP_PORT=3002
CODER_MCP_PORT=3003
MARKETING_MCP_PORT=3004






💻 Complete Code
Shared Utilities
// mcp-servers/shared/database.ts

import { neon } from '@neondatabase/serverless';

export const sql = neon(process.env.DATABASE_URL!);

export async function queryKnowledgeBase(
  agentType: string,
  category: string,
  key?: string
) {
  let query = sql`
    SELECT id, key, value, metadata
    FROM knowledge_base
    WHERE agent_type = ${agentType}
    AND category = ${category}
    AND is_active = true
  `;
  
  if (key) {
    query = sql`
      SELECT id, key, value, metadata
      FROM knowledge_base
      WHERE agent_type = ${agentType}
      AND category = ${category}
      AND key = ${key}
      AND is_active = true
    `;
  }
  
  const results = await query;
  return results;
}

export async function logToolCall(
  conversationId: string,
  agentType: string,
  toolName: string,
  input: any,
  output: any,
  status: 'success' | 'failed',
  executionTime: number,
  errorMessage?: string
) {
  await sql`
    INSERT INTO mcp_tool_calls (
      conversation_id,
      agent_type,
      tool_name,
      input_params,
      output_result,
      status,
      execution_time_ms,
      error_message,
      created_at
    ) VALUES (
      ${conversationId},
      ${agentType},
      ${toolName},
      ${JSON.stringify(input)},
      ${JSON.stringify(output)},
      ${status},
      ${executionTime},
      ${errorMessage || null},
      NOW()
    )
  `;
}
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



--------------------------------------------
Design Agent MCP (Port 3001)
// mcp-servers/design-agent/server.ts

import express from 'express';
import cors from 'cors';
import { queryKnowledgeBase, logToolCall } from '../shared/database';
import { MCPToolDefinition, ToolContext } from '../shared/types';
import { log } from '../shared/logger';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.DESIGN_MCP_PORT || 3001;

// ✅ Tool 1: Get Design Principles (No external API needed)
const getDesignPrinciples: MCPToolDefinition = {
  name: 'getDesignPrinciples',
  description: 'Retrieve design principles from knowledge base',
  inputSchema: {
    type: 'object',
    properties: {
      category: {
        type: 'string',
        enum: ['typography', 'layout', 'color', 'ux', 'accessibility'],
        description: 'Design principle category'
      }
    },
    required: ['category']
  },
  handler: async (input: { category: string }, context?: ToolContext) => {
    const startTime = Date.now();
    
    try {
      const results = await queryKnowledgeBase('design', 'design_principles', input.category);
      
      if (context?.conversationId) {
        await logToolCall(
          context.conversationId,
          'design',
          'getDesignPrinciples',
          input,
          results,
          'success',
          Date.now() - startTime
        );
      }
      
      return {
        principles: results.map(r => ({
          key: r.key,
          principle: r.value,
          examples: r.metadata?.examples || []
        })),
        category: input.category,
        count: results.length
      };
    } catch (error: any) {
      log('error', 'getDesignPrinciples failed', { error: error.message });
      
      if (context?.conversationId) {
        await logToolCall(
          context.conversationId,
          'design',
          'getDesignPrinciples',
          input,
          null,
          'failed',
          Date.now() - startTime,
          error.message
        );
      }
      
      throw error;
    }
  }
};

// 🔌 Tool 2: Generate Mockup (Figma API - Optional)
const generateMockup: MCPToolDefinition = {
  name: 'generateMockup',
  description: 'Generate design mockup using Figma API',
  inputSchema: {
    type: 'object',
    properties: {
      template: {
        type: 'string',
        description: 'Template type (landing_page, mobile_app, dashboard)'
      },
      customizations: {
        type: 'object',
        description: 'Design customizations (colors, fonts, layout)'
      }
    },
    required: ['template']
  },
  handler: async (input: { template: string; customizations?: any }) => {
    // 🔌 NOTE: Requires FIGMA_ACCESS_TOKEN
    const figmaToken = process.env.FIGMA_ACCESS_TOKEN;
    
    if (!figmaToken) {
      log('warn', 'Figma API not configured - returning mock response');
      return {
        mockupUrl: 'https://via.placeholder.com/800x600?text=Mockup+Preview',
        message: 'Figma API not configured. This is a placeholder.',
        template: input.template,
        note: 'Set FIGMA_ACCESS_TOKEN to enable real mockup generation'
      };
    }
    
    // Real Figma API call
    try {
      const response = await fetch('https://api.figma.com/v1/files/YOUR_FILE_KEY/images', {
        method: 'POST',
        headers: {
          'X-Figma-Token': figmaToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          // Figma API parameters
          format: 'png',
          scale: 2
        })
      });
      
      const data = await response.json();
      
      return {
        mockupUrl: data.images?.['node-id'] || 'placeholder',
        figmaFileKey: 'YOUR_FILE_KEY',
        template: input.template
      };
    } catch (error: any) {
      log('error', 'Figma API call failed', { error: error.message });
      throw new Error('Mockup generation failed: ' + error.message);
    }
  }
};

// ✅ Tool 3: Get Color Palettes (No external API needed)
const getColorPalettes: MCPToolDefinition = {
  name: 'getColorPalettes',
  description: 'Get color palette recommendations',
  inputSchema: {
    type: 'object',
    properties: {
      style: {
        type: 'string',
        enum: ['modern', 'vintage', 'bold', 'minimal', 'corporate'],
        description: 'Design style'
      },
      count: {
        type: 'number',
        default: 3,
        description: 'Number of palettes to return'
      }
    },
    required: ['style']
  },
  handler: async (input: { style: string; count?: number }) => {
    const results = await queryKnowledgeBase('design', 'color_palettes', input.style);
    
    return {
      palettes: results.slice(0, input.count || 3).map(r => ({
        name: r.metadata?.name || 'Unnamed Palette',
        colors: r.metadata?.colors || [],
        usageNotes: r.value
      })),
      style: input.style
    };
  }
};

// Register all tools
const tools = {
  getDesignPrinciples,
  generateMockup,
  getColorPalettes
};

// API Endpoints
app.post('/execute', async (req, res) => {
  const { tool, input, context } = req.body;
  
  if (!tools[tool as keyof typeof tools]) {
    return res.status(404).json({ error: 'Tool not found' });
  }
  
  try {
    const result = await tools[tool as keyof typeof tools].handler(input, context);
    res.json({ success: true, result });
  } catch (error: any) {
    log('error', `Tool execution failed: ${tool}`, { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

app.get('/tools', (req, res) => {
  res.json({
    agentType: 'design',
    tools: Object.entries(tools).map(([name, tool]) => ({
      name,
      description: tool.description,
      inputSchema: tool.inputSchema
    }))
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', agentType: 'design', port: PORT });
});

app.listen(PORT, () => {
  log('info', `Design MCP Server running on port ${PORT}`);
});


-----------------------------------------------------------------------
Analyst Agent MCP (Port 3002)
// mcp-servers/analyst-agent/server.ts

import express from 'express';
import cors from 'cors';
import { queryKnowledgeBase, logToolCall, sql } from '../shared/database';
import { MCPToolDefinition } from '../shared/types';
import { log } from '../shared/logger';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.ANALYST_MCP_PORT || 3002;

// 🔌 Tool 1: Query Google Sheets (Optional)
const queryGoogleSheets: MCPToolDefinition = {
  name: 'queryGoogleSheets',
  description: 'Fetch data from Google Sheets',
  inputSchema: {
    type: 'object',
    properties: {
      spreadsheetId: { type: 'string', description: 'Google Sheets ID' },
      range: { type: 'string', description: 'Range (e.g., Sheet1!A1:D10)' }
    },
    required: ['spreadsheetId', 'range']
  },
  handler: async (input: { spreadsheetId: string; range: string }) => {
    // 🔌 NOTE: Requires Google OAuth credentials
    const hasGoogleAuth = process.env.GOOGLE_SHEETS_CLIENT_ID && 
                          process.env.GOOGLE_SHEETS_REFRESH_TOKEN;
    
    if (!hasGoogleAuth) {
      log('warn', 'Google Sheets API not configured - returning mock data');
      return {
        data: [
          ['Month', 'Sales', 'Revenue', 'Profit'],
          ['Jan', '100', '10000', '2000'],
          ['Feb', '120', '12000', '2400']
        ],
        range: input.range,
        note: 'Mock data - Set GOOGLE_SHEETS credentials to fetch real data'
      };
    }
    
    // Real Google Sheets API call
    const { google } = require('googleapis');
    const sheets = google.sheets('v4');
    
    // TODO: Implement proper OAuth2 flow
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_SHEETS_CLIENT_ID,
      process.env.GOOGLE_SHEETS_CLIENT_SECRET
    );
    
    auth.setCredentials({
      refresh_token: process.env.GOOGLE_SHEETS_REFRESH_TOKEN
    });
    
    try {
      const response = await sheets.spreadsheets.values.get({
        auth,
        spreadsheetId: input.spreadsheetId,
        range: input.range
      });
      
      return {
        data: response.data.values || [],
        range: input.range,
        rowCount: response.data.values?.length || 0
      };
    } catch (error: any) {
      throw new Error('Google Sheets API error: ' + error.message);
    }
  }
};

// ✅ Tool 2: Statistical Analysis (No external API needed)
const statisticalAnalysis: MCPToolDefinition = {
  name: 'statisticalAnalysis',
  description: 'Perform statistical analysis on dataset',
  inputSchema: {
    type: 'object',
    properties: {
      data: {
        type: 'array',
        items: { type: 'number' },
        description: 'Numeric dataset'
      },
      method: {
        type: 'string',
        enum: ['mean', 'median', 'stddev', 'correlation'],
        description: 'Statistical method'
      }
    },
    required: ['data', 'method']
  },
  handler: async (input: { data: number[]; method: string }) => {
    const stats = require('simple-statistics');
    
    let result: any = {};
    
    switch (input.method) {
      case 'mean':
        result.mean = stats.mean(input.data);
        break;
      case 'median':
        result.median = stats.median(input.data);
        break;
      case 'stddev':
        result.mean = stats.mean(input.data);
        result.stddev = stats.standardDeviation(input.data);
        result.variance = stats.variance(input.data);
        break;
      case 'correlation':
        // Assuming data is [[x1,y1], [x2,y2], ...]
        result.correlation = stats.sampleCorrelation(
          input.data.map((d: any) => d[0]),
          input.data.map((d: any) => d[1])
        );
        break;
    }
    
    return {
      method: input.method,
      dataPoints: input.data.length,
      result
    };
  }
};

// ✅ Tool 3: SQL Query (Direct Neon access)
const runSQLQuery: MCPToolDefinition = {
  name: 'runSQLQuery',
  description: 'Execute SQL query on database (read-only)',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'SQL SELECT query (read-only)'
      }
    },
    required: ['query']
  },
  handler: async (input: { query: string }) => {
    // Security: Only allow SELECT queries
    const normalizedQuery = input.query.trim().toLowerCase();
    if (!normalizedQuery.startsWith('select')) {
      throw new Error('Only SELECT queries are allowed');
    }
    
    try {
      const results = await sql.unsafe(input.query);
      
      return {
        rows: results,
        rowCount: results.length,
        query: input.query
      };
    } catch (error: any) {
      throw new Error('SQL query error: ' + error.message);
    }
  }
};

const tools = {
  queryGoogleSheets,
  statisticalAnalysis,
  runSQLQuery
};

// API Endpoints (same as Design Agent)
app.post('/execute', async (req, res) => {
  const { tool, input, context } = req.body;
  
  if (!tools[tool as keyof typeof tools]) {
    return res.status(404).json({ error: 'Tool not found' });
  }
  
  try {
    const result = await tools[tool as keyof typeof tools].handler(input, context);
    res.json({ success: true, result });
  } catch (error: any) {
    log('error', `Tool execution failed: ${tool}`, { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

app.get('/tools', (req, res) => {
  res.json({
    agentType: 'analyst',
    tools: Object.entries(tools).map(([name, tool]) => ({
      name,
      description: tool.description,
      inputSchema: tool.inputSchema
    }))
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', agentType: 'analyst', port: PORT });
});

app.listen(PORT, () => {
  log('info', `Analyst MCP Server running on port ${PORT}`);
});



------------------------------------------
Coder Agent MCP (Port 3003)
// mcp-servers/coder-agent/server.ts

import express from 'express';
import cors from 'cors';
import { queryKnowledgeBase } from '../shared/database';
import { MCPToolDefinition } from '../shared/types';
import { log } from '../shared/logger';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.CODER_MCP_PORT || 3003;

// ✅ Tool 1: Get Code Templates (No external API needed)
const getCodeTemplates: MCPToolDefinition = {
  name: 'getCodeTemplates',
  description: 'Get code templates from knowledge base',
  inputSchema: {
    type: 'object',
    properties: {
      framework: {
        type: 'string',
        description: 'Framework name (react, express, fastapi, etc.)'
      },
      type: {
        type: 'string',
        description: 'Template type (component, api, hook, etc.)'
      }
    },
    required: ['framework', 'type']
  },
  handler: async (input: { framework: string; type: string }) => {
    const key = `${input.framework}_${input.type}`;
    const results = await queryKnowledgeBase('coder', 'code_templates', key);
    
    return {
      templates: results.map(r => ({
        name: r.metadata?.name || key,
        code: r.value,
        language: r.metadata?.language || 'javascript',
        description: r.metadata?.description || ''
      })),
      framework: input.framework,
      type: input.type
    };
  }
};

// 🔌 Tool 2: Search GitHub (Optional)
const searchGitHub: MCPToolDefinition = {
  name: 'searchGitHub',
  description: 'Search GitHub repositories',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query' },
      language: { type: 'string', description: 'Programming language filter' }
    },
    required: ['query']
  },
  handler: async (input: { query: string; language?: string }) => {
    const githubToken = process.env.GITHUB_TOKEN;
    
    if (!githubToken) {
      log('warn', 'GitHub API not configured - returning mock data');
      return {
        repositories: [
          {
            name: 'example-repo',
            url: 'https://github.com/example/repo',
            description: 'Example repository',
            stars: 100
          }
        ],
        note: 'Mock data - Set GITHUB_TOKEN to search real repositories'
      };
    }
    
    // Real GitHub API call
    try {
      let searchQuery = input.query;
      if (input.language) {
        searchQuery += ` language:${input.language}`;
      }
      
      const response = await fetch(
        `https://api.github.com/search/repositories?q=${encodeURIComponent(searchQuery)}&sort=stars&per_page=5`,
        {
          headers: {
            'Authorization': `token ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );
      
      const data = await response.json();
      
      return {
        repositories: data.items.map((repo: any) => ({
          name: repo.full_name,
          url: repo.html_url,
          description: repo.description,
          stars: repo.stargazers_count,
          language: repo.language
        })),
        totalCount: data.total_count
      };
    } catch (error: any) {
      throw new Error('GitHub API error: ' + error.message);
    }
  }
};

// 🔌 Tool 3: Execute Code (Optional - Judge0)
const executeCode: MCPToolDefinition = {
  name: 'executeCode',
  description: 'Execute code in sandboxed environment',
  inputSchema: {
    type: 'object',
    properties: {
      code: { type: 'string', description: 'Code to execute' },
      language: {
        type: 'string',
        enum: ['javascript', 'python', 'typescript'],
        description: 'Programming language'
      }
    },
    required: ['code', 'language']
  },
  handler: async (input: { code: string; language: string }) => {
    const judge0Key = process.env.JUDGE0_API_KEY;
    
    if (!judge0Key) {
      log('warn', 'Judge0 API not configured - returning mock execution');
      return {
        stdout: 'Mock execution successful',
        stderr: '',
        status: 'success',
        note: 'Set JUDGE0_API_KEY to execute real code'
      };
    }
    
    // Real Judge0 API call
    const languageIds: Record<string, number> = {
      javascript: 63, // Node.js
      python: 71, // Python 3
      typescript: 74 // TypeScript
    };
    
    try {
      const response = await fetch('https://judge0-ce.p.rapidapi.com/submissions?wait=true', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'X-RapidAPI-Key': judge0Key,
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
        },
        body: JSON.stringify({
          source_code: input.code,
          language_id: languageIds[input.language],
          stdin: ''
        })
      });
      
      const result = await response.json();
      
      return {
        stdout: result.stdout || '',
        stderr: result.stderr || '',
        status: result.status?.description || 'unknown',
        executionTime: result.time
      };
    } catch (error: any) {
      throw new Error('Code execution failed: ' + error.message);
    }
  }
};

const tools = {
  getCodeTemplates,
  searchGitHub,
  executeCode
};

// API Endpoints (same pattern)
app.post('/execute', async (req, res) => {
  const { tool, input, context } = req.body;
  
  if (!tools[tool as keyof typeof tools]) {
    return res.status(404).json({ error: 'Tool not found' });
  }
  
  try {
    const result = await tools[tool as keyof typeof tools].handler(input, context);
    res.json({ success: true, result });
  } catch (error: any) {
    log('error', `Tool execution failed: ${tool}`, { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

app.get('/tools', (req, res) => {
  res.json({
    agentType: 'coder',
    tools: Object.entries(tools).map(([name, tool]) => ({
      name,
      description: tool.description,
      inputSchema: tool.inputSchema
    }))
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', agentType: 'coder', port: PORT });
});

app.listen(PORT, () => {
  log('info', `Coder MCP Server running on port ${PORT}`);
});

-------------------------------------------------------------
Marketing Agent MCP (Port 3004)
// mcp-servers/marketing-agent/server.ts

import express from 'express';
import cors from 'cors';
import { queryKnowledgeBase } from '../shared/database';
import { MCPToolDefinition } from '../shared/types';
import { log } from '../shared/logger';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.MARKETING_MCP_PORT || 3004;

// ✅ Tool 1: Get Content Templates (No external API needed)
const getContentTemplates: MCPToolDefinition = {
  name: 'getContentTemplates',
  description: 'Get marketing content templates',
  inputSchema: {
    type: 'object',
    properties: {
      platform: {
        type: 'string',
        enum: ['instagram', 'facebook', 'linkedin', 'twitter', 'email'],
        description: 'Social media platform'
      },
      type: {
        type: 'string',
        description: 'Content type (post, story, ad, email)'
      }
    },
    required: ['platform', 'type']
  },
  handler: async (input: { platform: string; type: string }) => {
    const key = `template_${input.platform}_${input.type}`;
    const results = await queryKnowledgeBase('marketing', 'content_templates', key);
    
    return {
      templates: results.map(r => ({
        template: r.value,
        variables: r.metadata?.variables || [],
        examples: r.metadata?.examples || [],
        bestPractices: r.metadata?.bestPractices || []
      })),
      platform: input.platform,
      type: input.type
    };
  }
};

// ✅ Tool 2: SEO Analysis (No external API needed - built-in)
const analyzeSEO: MCPToolDefinition = {
  name: 'analyzeSEO',
  description: 'Analyze content for SEO optimization',
  inputSchema: {
    type: 'object',
    properties: {
      content: { type: 'string', description: 'Content to analyze' },
      targetKeyword: { type: 'string', description: 'Target SEO keyword' }
    },
    required: ['content', 'targetKeyword']
  },
  handler: async (input: { content: string; targetKeyword: string }) => {
    // Simple SEO analysis (can be enhanced)
    const content = input.content.toLowerCase();
    const keyword = input.targetKeyword.toLowerCase();
    
    const wordCount = input.content.split(/\s+/).length;
    const keywordCount = (content.match(new RegExp(keyword, 'g')) || []).length;
    const keywordDensity = (keywordCount / wordCount) * 100;
    
    const hasTitle = content.includes('<h1') || content.includes('# ');
    const hasMetaDescription = content.length >= 150 && content.length <= 160;
    
    let score = 0;
    const recommendations: string[] = [];
    
    // Scoring
    if (keywordDensity >= 1 && keywordDensity <= 3) {
      score += 25;
    } else if (keywordDensity < 1) {
      recommendations.push(`Increase keyword "${input.targetKeyword}" usage (current: ${keywordDensity.toFixed(2)}%)`);
    } else {
      recommendations.push(`Reduce keyword density (current: ${keywordDensity.toFixed(2)}%, ideal: 1-3%)`);
    }
    
    if (wordCount >= 300) {
      score += 25;
    } else {
      recommendations.push(`Increase content length (current: ${wordCount} words, ideal: 300+)`);
    }
    
    if (hasTitle) {
      score += 25;
    } else {
      recommendations.push('Add a clear H1 title with target keyword');
    }
    
    if (content.includes(keyword)) {
      score += 25;
    }
    
    return {
      score,
      keywordDensity: keywordDensity.toFixed(2) + '%',
      wordCount,
      keywordCount,
      recommendations,
      rating: score >= 75 ? 'good' : score >= 50 ? 'fair' : 'needs improvement'
    };
  }
};

// ✅ Tool 3: Generate Hashtags (No external API needed)
const generateHashtags: MCPToolDefinition = {
  name: 'generateHashtags',
  description: 'Generate relevant hashtags for content',
  inputSchema: {
    type: 'object',
    properties: {
      content: { type: 'string', description: 'Content to generate hashtags for' },
      count: { type: 'number', default: 10, description: 'Number of hashtags' }
    },
    required: ['content']
  },
  handler: async (input: { content: string; count?: number }) => {
    // Simple hashtag generation (extract keywords)
    const words = input.content.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 4); // Only words > 4 chars
    
    // Remove common words
    const commonWords = new Set(['that', 'this', 'with', 'from', 'have', 'been', 'will', 'would', 'could', 'should']);
    const keywords = words.filter(w => !commonWords.has(w));
    
    // Get unique keywords
    const uniqueKeywords = [...new Set(keywords)];
    
    // Generate hashtags
    const hashtags = uniqueKeywords
      .slice(0, input.count || 10)
      .map(w => '#' + w.charAt(0).toUpperCase() + w.slice(1));
    
    return {
      hashtags,
      count: hashtags.length,
      note: 'Auto-generated from content keywords'
    };
  }
};

const tools = {
  getContentTemplates,
  analyzeSEO,
  generateHashtags
};

// API Endpoints (same pattern)
app.post('/execute', async (req, res) => {
  const { tool, input, context } = req.body;
  
  if (!tools[tool as keyof typeof tools]) {
    return res.status(404).json({ error: 'Tool not found' });
  }
  
  try {
    const result = await tools[tool as keyof typeof tools].handler(input, context);
    res.json({ success: true, result });
  } catch (error: any) {
    log('error', `Tool execution failed: ${tool}`, { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

app.get('/tools', (req, res) => {
  res.json({
    agentType: 'marketing',
    tools: Object.entries(tools).map(([name, tool]) => ({
      name,
      description: tool.description,
      inputSchema: tool.inputSchema
    }))
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', agentType: 'marketing', port: PORT });
});

app.listen(PORT, () => {
  log('info', `Marketing MCP Server running on port ${PORT}`);
});

------------------------------------------
🚀 Running MCP Servers
Development (Local)
# Terminal 1: Design Agent
cd mcp-servers/design-agent
npm run dev

# Terminal 2: Analyst Agent
cd mcp-servers/analyst-agent
npm run dev

# Terminal 3: Coder Agent
cd mcp-servers/coder-agent
npm run dev

# Terminal 4: Marketing Agent
cd mcp-servers/marketing-agent
npm run dev

-------------------------
Production (Railway/Fly.io)
# Each MCP server = separate service

# Railway
railway init
railway link
railway up

# Fly.io
fly launch
fly deploy

----------------------------

🔗 Connecting Orchestrator to MCP
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

--------------------------------------
📝 Summary Checklist
✅ Works Immediately (No API Keys Needed)

 All Knowledge Base queries
 Statistical analysis
 SEO analysis
 Hashtag generation
 Code templates
 SQL queries (Neon)

🔌 Optional External APIs (For Enhanced Features)
Design Agent:

 Figma API → Set FIGMA_ACCESS_TOKEN
 Canva API → Set CANVA_API_KEY

Analyst Agent:

 Google Sheets → Set Google OAuth credentials
 Google Analytics → Set GA4 credentials

Coder Agent:
 GitHub → Set GITHUB_TOKEN
 Judge0 (code execution) → Set JUDGE0_API_KEY

Marketing Agent:

 (All tools work without external APIs!)

🎯 What You Need to Do

✅ Setup .env file with DATABASE_URL (Required)
✅ Run npm install in mcp-servers folder
✅ Start all 4 MCP servers locally
✅ Test with Orchestrator (call tools via API)
🔌 Add API keys when you're ready (optional




