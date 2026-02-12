import Anthropic from '@anthropic-ai/sdk';
import { VisionAnalysisResult } from '@/lib/attachment/vision-analyzer';
import { AgentType } from '@/lib/agent/boundaries';
import { addKBEntry, KnowledgeEntry } from '@/lib/agent/knowledge-manager';
import { Redis } from '@upstash/redis';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/**
 * Summarization result
 */
export interface ImageSummarizationResult {
  summary: string;
  keyInsights: string[];
  suggestedCategory: string;
  suggestedKey: string;
  suggestedKBEntry?: string;
  isKBWorthy: boolean;
  confidence: number; // 0-100
}

/**
 * Summarize image for Knowledge Base entry
 * Analyzes vision analysis result and creates a condensed summary suitable for KB
 */
export async function summarizeImageForKB(
  imageBase64: string,
  mimeType: string,
  agentType: AgentType,
  visionAnalysis?: VisionAnalysisResult
): Promise<ImageSummarizationResult> {
  try {
    // Check cache
    const cacheKey = `kb-summary:${agentType}:${imageBase64.substring(0, 20)}`;
    const cached = await redis.get<ImageSummarizationResult>(cacheKey);
    if (cached) {
      return cached;
    }

    // Build summarization prompt
    const summaryPrompt = buildSummarizationPrompt(agentType, visionAnalysis);

    // Call Claude to generate KB-suitable summary
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: [
            visionAnalysis
              ? {
                  type: 'text',
                  text: summaryPrompt,
                }
              : {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: mimeType as
                      | 'image/jpeg'
                      | 'image/png'
                      | 'image/gif'
                      | 'image/webp',
                    data: imageBase64,
                  },
                },
            visionAnalysis
              ? undefined
              : {
                  type: 'text',
                  text: summaryPrompt,
                },
          ].filter(Boolean) as any[],
        },
      ],
    });

    const responseText = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('\n');

    // Parse response
    const result = parseSummarizationResponse(responseText, agentType);

    // Cache result (7 days)
    await redis.setex(cacheKey, 604800, result);

    return result;
  } catch (error) {
    console.error('Failed to summarize image for KB:', error);
    throw error;
  }
}

/**
 * Create Knowledge Base entry from analyzed image
 * Returns KnowledgeEntry if successful, null otherwise
 */
export async function createKBEntryFromImage(
  attachmentId: string,
  agentType: AgentType,
  analysis: VisionAnalysisResult
): Promise<KnowledgeEntry | null> {
  try {
    // First, summarize the analysis
    const summary = await summarizeImageForKB('', '', agentType, analysis);

    // Only create KB entry if it's KB-worthy and confidence is high
    if (!summary.isKBWorthy || summary.confidence < 70) {
      console.log(
        `Skipping KB entry (KB-worthy: ${summary.isKBWorthy}, confidence: ${summary.confidence})`
      );
      return null;
    }

    // Create KB entry
    const kbEntry: Omit<KnowledgeEntry, 'id' | 'createdAt' | 'updatedAt'> = {
      agentType,
      sourceType: 'file_upload', // Images are uploaded files
      category: summary.suggestedCategory,
      key: summary.suggestedKey,
      value: summary.suggestedKBEntry || summary.summary,
      metadata: {
        attachmentId,
        detectedType: analysis.detectedType,
        confidence: analysis.confidence,
        keyPoints: analysis.keyPoints,
        analyzedAt: new Date().toISOString(),
        sourceFile: 'vision_analysis',
      },
      isActive: true,
    };

    // Add to knowledge base
    const createdEntry = await addKBEntry(kbEntry);
    console.log(`Created KB entry from image: ${createdEntry.id}`);

    return createdEntry;
  } catch (error) {
    console.error('Failed to create KB entry from image:', error);
    return null;
  }
}

/**
 * Build summarization prompt based on agent type
 */
function buildSummarizationPrompt(
  agentType: AgentType,
  visionAnalysis?: VisionAnalysisResult
): string {
  const analysisContext = visionAnalysis
    ? `
Based on this vision analysis:
- Analysis: ${visionAnalysis.analysis}
- Detected Type: ${visionAnalysis.detectedType}
- Confidence: ${visionAnalysis.confidence}
- Key Points: ${visionAnalysis.keyPoints.join(', ')}
`
    : '';

  const agentPrompts: Record<AgentType, string> = {
    design: `${analysisContext}

Summarize this design/UI image for a Knowledge Base entry.

Create:
1. A concise summary (1-2 sentences) for the KB
2. Key insights that are reusable (3-4 main points)
3. Suggested KB category (e.g., "color_theory", "typography", "design_patterns")
4. Suggested KB key (e.g., "primary_color_blue", "h1_font_size")
5. Whether this is KB-worthy (high confidence + reusable value)

Be selective - only KB entries if the insight is broadly applicable.

Respond with JSON:
{
  "summary": "One-line summary of the design insight",
  "insights": ["insight 1", "insight 2"],
  "category": "design_patterns",
  "key": "pattern_name_or_insight_key",
  "is_kb_worthy": true/false,
  "confidence": 75
}`,

    analyst: `${analysisContext}

Summarize this data/chart image for a Knowledge Base entry.

Create:
1. A concise summary (1-2 sentences) describing what data is shown
2. Key metrics or patterns visible (3-4 main points)
3. Suggested KB category (e.g., "metrics", "data_analysis", "benchmarks")
4. Suggested KB key (e.g., "revenue_growth_metric", "conversion_rate")
5. Whether this is KB-worthy (actionable insight + reusable data)

Only create KB entries for metrics/patterns that are broadly applicable.

Respond with JSON:
{
  "summary": "One-line description of the data/metric",
  "insights": ["metric 1", "metric 2"],
  "category": "metrics",
  "key": "metric_key_name",
  "is_kb_worthy": true/false,
  "confidence": 85
}`,

    coder: `${analysisContext}

Summarize this code/technical image for a Knowledge Base entry.

Create:
1. A concise summary (1-2 sentences) of the code pattern or error
2. Key learnings or best practices (3-4 main points)
3. Suggested KB category (e.g., "best_practices", "error_handling", "code_patterns")
4. Suggested KB key (e.g., "async_await_pattern", "error_boundary_pattern")
5. Whether this is KB-worthy (reusable pattern + actionable)

Focus on patterns and practices that apply to future development.

Respond with JSON:
{
  "summary": "One-line summary of the code pattern or solution",
  "insights": ["insight 1", "insight 2"],
  "category": "best_practices",
  "key": "pattern_name",
  "is_kb_worthy": true/false,
  "confidence": 80
}`,

    marketing: `${analysisContext}

Summarize this marketing/content image for a Knowledge Base entry.

Create:
1. A concise summary (1-2 sentences) of the marketing insight
2. Key takeaways for copywriting/content (3-4 main points)
3. Suggested KB category (e.g., "content_strategy", "copywriting", "audience_insights")
4. Suggested KB key (e.g., "emotional_trigger_trust", "cta_conversion_pattern")
5. Whether this is KB-worthy (broadly applicable insight)

Only create KB entries for insights that improve future marketing efforts.

Respond with JSON:
{
  "summary": "One-line marketing insight",
  "insights": ["insight 1", "insight 2"],
  "category": "copywriting",
  "key": "insight_key_name",
  "is_kb_worthy": true/false,
  "confidence": 75
}`,
  };

  return agentPrompts[agentType];
}

/**
 * Parse summarization response
 */
function parseSummarizationResponse(
  responseText: string,
  agentType: AgentType
): ImageSummarizationResult {
  // Extract JSON from response
  const jsonMatch = responseText.match(/\{[\s\S]*\}(?![\s\S]*\{)/);
  let parsedData = {
    summary: 'Image analyzed and summarized',
    insights: [],
    category: 'general',
    key: `${agentType}_analysis_${Date.now()}`,
    is_kb_worthy: false,
    confidence: 50,
  };

  if (jsonMatch) {
    try {
      parsedData = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.warn('Failed to parse summarization JSON:', e);
    }
  }

  // Map JSON keys to camelCase
  const insights = Array.isArray(parsedData.insights) ? parsedData.insights : [];
  const summary = String(parsedData.summary || '');
  const category = String(parsedData.category || 'general');
  const key = String(parsedData.key || `${agentType}_analysis_${Date.now()}`);
  const isKBWorthy = Boolean(parsedData.is_kb_worthy);
  const confidence = Math.min(100, Math.max(0, Number(parsedData.confidence) || 50));

  return {
    summary: summary || responseText.substring(0, 200),
    keyInsights: insights,
    suggestedCategory: category,
    suggestedKey: sanitizeKey(key),
    suggestedKBEntry: buildKBEntryValue(summary, insights),
    isKBWorthy,
    confidence,
  };
}

/**
 * Sanitize key for KB (lowercase, underscore-separated)
 */
function sanitizeKey(key: string): string {
  return key
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .substring(0, 100);
}

/**
 * Build KB entry value from summary and insights
 */
function buildKBEntryValue(summary: string, insights: string[]): string {
  let entry = summary;
  if (insights.length > 0) {
    entry += '\n\nKey Points:\n' + insights.map((i) => `- ${i}`).join('\n');
  }
  return entry;
}

/**
 * Batch summarize multiple images
 */
export async function summarizeImagesInBatch(
  images: Array<{ base64: string; mimeType: string; analysis?: VisionAnalysisResult }>,
  agentType: AgentType
): Promise<ImageSummarizationResult[]> {
  const results: ImageSummarizationResult[] = [];

  for (const image of images) {
    try {
      const result = await summarizeImageForKB(image.base64, image.mimeType, agentType, image.analysis);
      results.push(result);
    } catch (error) {
      console.error('Failed to summarize image in batch:', error);
      results.push({
        summary: 'Failed to summarize',
        keyInsights: [],
        suggestedCategory: 'general',
        suggestedKey: `failed_${Date.now()}`,
        isKBWorthy: false,
        confidence: 0,
      });
    }
  }

  return results;
}

/**
 * Check if image is worth adding to KB
 * Considers confidence, content type, and agent alignment
 */
export function isImageKBWorthy(
  analysis: VisionAnalysisResult,
  agentType: AgentType,
  minConfidence: number = 70
): boolean {
  // Must have high confidence
  if (analysis.confidence < minConfidence) {
    return false;
  }

  // Check agent/content alignment
  const alignmentMap: Record<AgentType, string[]> = {
    design: ['design'],
    analyst: ['data'],
    coder: ['code'],
    marketing: ['other'],
  };

  const acceptedTypes = alignmentMap[agentType];
  if (!acceptedTypes.includes(analysis.detectedType)) {
    // Allow 'other' as fallback for any agent
    if (analysis.detectedType !== 'other') {
      return false;
    }
  }

  // Must have at least one key point
  if (analysis.keyPoints.length === 0) {
    return false;
  }

  return true;
}

/**
 * Invalidate summarization cache
 */
export async function invalidateSummaryCache(imageHash: string): Promise<void> {
  try {
    await redis.del(`kb-summary:*:${imageHash}`);
  } catch (error) {
    console.error('Failed to invalidate summary cache:', error);
  }
}
