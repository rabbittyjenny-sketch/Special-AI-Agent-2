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
