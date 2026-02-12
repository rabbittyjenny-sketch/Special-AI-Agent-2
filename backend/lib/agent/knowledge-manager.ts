import { Redis } from '@upstash/redis';
import { neon } from '@neondatabase/serverless';
import { AgentType, DataSourceType } from './boundaries';
import { AGENT_BOUNDARIES, hasAuthority } from './boundaries';
import Anthropic from '@anthropic-ai/sdk';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const sql = neon(process.env.DATABASE_URL!);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

/**
 * Knowledge Base Entry Interface
 */
export interface KnowledgeEntry {
  id: string;
  agentType: AgentType;
  sourceType: string;
  category: string;
  key: string;
  value: string;
  metadata?: Record<string, any>;
  isActive: boolean;
  syncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * KB Query Filters
 */
export interface KBQueryFilters {
  category?: string;
  search?: string;
  sourceType?: string;
  limit?: number;
  offset?: number;
}

/**
 * KB Context for System Prompt
 */
export interface KBContext {
  entries: KnowledgeEntry[];
  categories: string[];
  sourceTypes: string[];
  summary: string;
}

/**
 * Query Knowledge Base with boundary enforcement
 * Ensures agents only access their authorized sources
 */
export async function queryKnowledgeBase(
  agent: AgentType,
  filters: KBQueryFilters = {}
): Promise<KnowledgeEntry[]> {
  try {
    const {
      category,
      search,
      sourceType,
      limit = 10,
      offset = 0,
    } = filters;

    // Check cache first
    const cacheKey = `kb:${agent}:${category || 'all'}:${search || 'all'}`;
    const cached = await redis.get<KnowledgeEntry[]>(cacheKey);
    if (cached) {
      return cached.slice(offset, offset + limit);
    }

    // Build query
    let query = `
      SELECT id, agent_type, source_type, category, key, value, metadata,
             is_active, synced_at, created_at, updated_at
      FROM knowledge_base
      WHERE agent_type = $1 AND is_active = true
    `;

    const params: any[] = [agent];
    let paramIndex = 2;

    if (category) {
      query += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (sourceType) {
      // Validate agent has authority over this source
      const access = validateAgentAccess(agent, sourceType);
      if (!access.allowed) {
        console.warn(
          `Agent ${agent} attempted unauthorized KB access to ${sourceType}: ${access.reason}`
        );
        return [];
      }

      query += ` AND source_type = $${paramIndex}`;
      params.push(sourceType);
      paramIndex++;
    }

    if (search) {
      query += ` AND (key ILIKE $${paramIndex} OR value ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    // Execute query
    const results = await sql(query, params);

    const entries: KnowledgeEntry[] = results.map((row: any) => ({
      id: row.id,
      agentType: row.agent_type,
      sourceType: row.source_type,
      category: row.category,
      key: row.key,
      value: row.value,
      metadata: row.metadata,
      isActive: row.is_active,
      syncedAt: row.synced_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    // Cache results (7 days)
    await redis.setex(cacheKey, 86400 * 7, entries);

    return entries;
  } catch (error) {
    console.error('KB Query Error:', error);
    return [];
  }
}

/**
 * Search Knowledge Base with semantic understanding
 * Uses keyword matching + AI-powered semantic search
 */
export async function searchKnowledgeBase(
  agent: AgentType,
  query: string,
  options: { limit?: number } = {}
): Promise<KnowledgeEntry[]> {
  const { limit = 5 } = options;

  try {
    // Check cache first
    const cacheKey = `kb:search:${agent}:${query}`;
    const cached = await redis.get<KnowledgeEntry[]>(cacheKey);
    if (cached) {
      return cached.slice(0, limit);
    }

    // First pass: keyword matching
    const keywordResults = await queryKnowledgeBase(agent, {
      search: query,
      limit: limit * 2,
    });

    // If we have good keyword matches, use them
    if (keywordResults.length >= limit) {
      await redis.setex(cacheKey, 3600, keywordResults);
      return keywordResults.slice(0, limit);
    }

    // Second pass: semantic search using Claude
    const allKBEntries = await queryKnowledgeBase(agent, { limit: 50 });

    if (allKBEntries.length === 0) {
      return [];
    }

    // Use Claude to find semantically similar entries
    const similarityPrompt = `
Given the search query: "${query}"

And these knowledge base entries (format: KEY | CATEGORY | VALUE):
${allKBEntries.map(e => `${e.key} | ${e.category} | ${e.value.substring(0, 100)}...`).join('\n')}

Return only the 3 most relevant entry KEYs that match the intent of the search query.
Format: comma-separated list of keys, nothing else.
`;

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 100,
      messages: [{ role: 'user', content: similarityPrompt }],
    });

    const similarKeys = (
      response.content[0].type === 'text' ? response.content[0].text : ''
    )
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);

    const semanticResults = allKBEntries.filter(e =>
      similarKeys.includes(e.key)
    );

    const finalResults = [...keywordResults, ...semanticResults].slice(0, limit);

    // Cache results (1 hour)
    await redis.setex(cacheKey, 3600, finalResults);

    return finalResults;
  } catch (error) {
    console.error('Semantic Search Error:', error);
    // Fallback to keyword search
    return queryKnowledgeBase(agent, { search: query, limit });
  }
}

/**
 * Validate agent has authority to access KB source
 */
export function validateAgentAccess(
  agent: AgentType,
  sourceType: string
): { allowed: boolean; reason?: string } {
  // Check if source exists
  const validSources = [
    'google_sheets',
    'manual',
    'api',
    'file_upload',
    'web_scrape',
    'local_kb',
  ];
  if (!validSources.includes(sourceType)) {
    return {
      allowed: false,
      reason: `Unknown source type: ${sourceType}`,
    };
  }

  // Check agent boundary
  const hasAccess = hasAuthority(agent, sourceType as DataSourceType);
  if (!hasAccess) {
    return {
      allowed: false,
      reason: `Agent ${agent} does not have authority over ${sourceType}`,
    };
  }

  return { allowed: true };
}

/**
 * Build Knowledge Base context for system prompt
 * Formats KB entries into natural language context
 */
export async function buildKBContext(
  agent: AgentType,
  categories?: string[]
): Promise<string> {
  try {
    const entries = await queryKnowledgeBase(agent, {
      category: categories?.[0],
      limit: 5,
    });

    if (entries.length === 0) {
      return '';
    }

    const groupedByCategory: Record<string, KnowledgeEntry[]> = {};
    entries.forEach(entry => {
      if (!groupedByCategory[entry.category]) {
        groupedByCategory[entry.category] = [];
      }
      groupedByCategory[entry.category].push(entry);
    });

    let context = '📚 Knowledge Base Reference:\n\n';

    for (const [category, items] of Object.entries(groupedByCategory)) {
      context += `**${category}:**\n`;
      items.forEach(item => {
        context += `- **${item.key}**: ${item.value.substring(0, 150)}${item.value.length > 150 ? '...' : ''}\n`;
      });
      context += '\n';
    }

    return context;
  } catch (error) {
    console.error('KB Context Building Error:', error);
    return '';
  }
}

/**
 * Get all categories available for an agent
 */
export async function getKBCategories(agent: AgentType): Promise<string[]> {
  try {
    const cacheKey = `kb:${agent}:categories`;
    const cached = await redis.get<string[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const results = await sql(
      `
      SELECT DISTINCT category
      FROM knowledge_base
      WHERE agent_type = $1 AND is_active = true
      ORDER BY category
    `,
      [agent]
    );

    const categories = results.map((r: any) => r.category).filter(Boolean);

    await redis.setex(cacheKey, 86400, categories);

    return categories;
  } catch (error) {
    console.error('Get Categories Error:', error);
    return [];
  }
}

/**
 * Invalidate KB cache for an agent
 */
export async function invalidateKBCache(agent: AgentType): Promise<void> {
  try {
    // Get all cache keys for this agent and delete them
    const pattern = `kb:${agent}:*`;
    // Note: Redis doesn't have built-in pattern deletion via REST API
    // Instead, we use a timestamp-based strategy
    await redis.set(`kb:${agent}:invalidated_at`, new Date().toISOString());
  } catch (error) {
    console.error('Cache Invalidation Error:', error);
  }
}

/**
 * Add KB entry to knowledge base
 */
export async function addKBEntry(entry: Omit<KnowledgeEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<KnowledgeEntry> {
  try {
    // Validate agent can add to this source
    const access = validateAgentAccess(entry.agentType, entry.sourceType);
    if (!access.allowed) {
      throw new Error(`Agent cannot add entries to ${entry.sourceType}`);
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await sql(
      `
      INSERT INTO knowledge_base
      (id, agent_type, source_type, source_id, category, key, value, metadata, is_active, synced_at, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `,
      [
        id,
        entry.agentType,
        entry.sourceType,
        entry.metadata?.sourceId || null,
        entry.category,
        entry.key,
        entry.value,
        JSON.stringify(entry.metadata || {}),
        entry.isActive ?? true,
        now,
        now,
        now,
      ]
    );

    // Invalidate cache
    await invalidateKBCache(entry.agentType);

    return {
      ...entry,
      id,
      createdAt: now,
      updatedAt: now,
    };
  } catch (error) {
    console.error('Add KB Entry Error:', error);
    throw error;
  }
}

/**
 * Update KB entry
 */
export async function updateKBEntry(
  id: string,
  updates: Partial<Omit<KnowledgeEntry, 'id' | 'createdAt'>>
): Promise<KnowledgeEntry | null> {
  try {
    const now = new Date().toISOString();

    // Build update query dynamically
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (updates.value !== undefined) {
      fields.push(`value = $${paramIndex++}`);
      values.push(updates.value);
    }

    if (updates.category !== undefined) {
      fields.push(`category = $${paramIndex++}`);
      values.push(updates.category);
    }

    if (updates.metadata !== undefined) {
      fields.push(`metadata = $${paramIndex++}`);
      values.push(JSON.stringify(updates.metadata));
    }

    if (updates.isActive !== undefined) {
      fields.push(`is_active = $${paramIndex++}`);
      values.push(updates.isActive);
    }

    fields.push(`updated_at = $${paramIndex++}`);
    values.push(now);

    values.push(id);

    const result = await sql(
      `
      UPDATE knowledge_base
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `,
      values
    );

    if (result.length === 0) {
      return null;
    }

    const row = result[0];

    // Invalidate cache for this agent
    if (row.agent_type) {
      await invalidateKBCache(row.agent_type);
    }

    return {
      id: row.id,
      agentType: row.agent_type,
      sourceType: row.source_type,
      category: row.category,
      key: row.key,
      value: row.value,
      metadata: row.metadata,
      isActive: row.is_active,
      syncedAt: row.synced_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  } catch (error) {
    console.error('Update KB Entry Error:', error);
    throw error;
  }
}

/**
 * Delete KB entry (soft delete)
 */
export async function deleteKBEntry(id: string): Promise<boolean> {
  try {
    const result = await sql(
      `
      UPDATE knowledge_base
      SET is_active = false, updated_at = NOW()
      WHERE id = $1
      RETURNING agent_type
    `,
      [id]
    );

    if (result.length > 0) {
      await invalidateKBCache(result[0].agent_type);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Delete KB Entry Error:', error);
    return false;
  }
}

/**
 * Get KB statistics for an agent
 */
export async function getKBStats(agent: AgentType): Promise<{
  totalEntries: number;
  categoriesCount: number;
  sourceBreakdown: Record<string, number>;
  lastUpdated: string;
}> {
  try {
    const cacheKey = `kb:stats:${agent}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return cached as any;
    }

    const results = await sql(
      `
      SELECT
        COUNT(*) as total,
        COUNT(DISTINCT category) as categories,
        source_type,
        MAX(updated_at) as last_updated
      FROM knowledge_base
      WHERE agent_type = $1 AND is_active = true
      GROUP BY source_type
    `,
      [agent]
    );

    if (results.length === 0) {
      return {
        totalEntries: 0,
        categoriesCount: 0,
        sourceBreakdown: {},
        lastUpdated: new Date().toISOString(),
      };
    }

    const sourceBreakdown: Record<string, number> = {};
    let totalEntries = 0;
    let categoriesCount = 0;
    let lastUpdated = new Date().toISOString();

    results.forEach((row: any) => {
      sourceBreakdown[row.source_type] = parseInt(row.total, 10);
      totalEntries += parseInt(row.total, 10);
      categoriesCount = parseInt(row.categories, 10);
      if (row.last_updated) {
        lastUpdated = row.last_updated;
      }
    });

    const stats = {
      totalEntries,
      categoriesCount,
      sourceBreakdown,
      lastUpdated,
    };

    // Cache stats (1 hour)
    await redis.setex(cacheKey, 3600, stats);

    return stats;
  } catch (error) {
    console.error('KB Stats Error:', error);
    return {
      totalEntries: 0,
      categoriesCount: 0,
      sourceBreakdown: {},
      lastUpdated: new Date().toISOString(),
    };
  }
}
