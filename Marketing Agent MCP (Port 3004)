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
