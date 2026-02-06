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
