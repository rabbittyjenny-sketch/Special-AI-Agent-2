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
