import Anthropic from '@anthropic-ai/sdk';
import { Redis } from '@upstash/redis';
import { AgentType } from '@/lib/agent/boundaries';
import https from 'https';
import http from 'http';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/**
 * Vision Analysis Result
 */
export interface VisionAnalysisResult {
  analysis: string;
  summary: string;
  detectedType: 'design' | 'data' | 'code' | 'other';
  confidence: number; // 0-100
  keyPoints: string[];
  metadata: Record<string, any>;
}

/**
 * Analyze image with Claude Vision API
 * Supports base64-encoded images and handles caching
 */
export async function analyzeImageWithVision(
  imageInput: string | Buffer, // base64 string or URL
  mimeType: string,
  agentType: AgentType,
  userMessage?: string
): Promise<VisionAnalysisResult> {
  try {
    // Check cache first
    const cacheKey = `vision:${agentType}:${Buffer.isBuffer(imageInput) ? imageInput.toString().substring(0, 20) : imageInput.substring(0, 20)}`;
    const cached = await redis.get<VisionAnalysisResult>(cacheKey);
    if (cached) {
      return cached;
    }

    // Convert input to base64 if it's a URL
    let base64Data: string;
    if (typeof imageInput === 'string' && imageInput.startsWith('http')) {
      base64Data = await fetchImageAsBase64(imageInput);
    } else if (Buffer.isBuffer(imageInput)) {
      base64Data = imageInput.toString('base64');
    } else {
      base64Data = imageInput;
    }

    // Validate MIME type
    const validMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validMimes.includes(mimeType)) {
      throw new Error(`Unsupported MIME type: ${mimeType}`);
    }

    // Build vision analysis prompt based on agent type
    const analysisPrompt = buildVisionPrompt(agentType, userMessage);

    // Call Claude Vision API
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: analysisPrompt,
            },
          ],
        },
      ],
    });

    // Parse response
    const responseText = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('\n');

    // Extract structured analysis from Claude's response
    const analysis = parseVisionAnalysis(responseText, agentType);

    // Cache results (24 hours)
    await redis.setex(cacheKey, 86400, analysis);

    return analysis;
  } catch (error) {
    console.error('Vision analysis error:', error);
    throw error;
  }
}

/**
 * Batch analyze multiple images
 * Useful for processing multiple attachments at once
 */
export async function analyzeImagesInBatch(
  images: Array<{ data: string | Buffer; mimeType: string }>,
  agentType: AgentType
): Promise<VisionAnalysisResult[]> {
  const results: VisionAnalysisResult[] = [];

  for (const image of images) {
    try {
      const result = await analyzeImageWithVision(image.data, image.mimeType, agentType);
      results.push(result);
    } catch (error) {
      console.error('Failed to analyze image in batch:', error);
      // Continue with next image instead of failing entire batch
      results.push({
        analysis: 'Failed to analyze',
        summary: 'Error during analysis',
        detectedType: 'other',
        confidence: 0,
        keyPoints: [],
        metadata: { error: String(error) },
      });
    }
  }

  return results;
}

/**
 * Convert image URL to base64
 * Handles HTTP/HTTPS URLs
 */
export async function fetchImageAsBase64(imageUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const protocol = imageUrl.startsWith('https') ? https : http;

    protocol.get(imageUrl, { timeout: 10000 }, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to fetch image: ${response.statusCode}`));
        return;
      }

      const chunks: Buffer[] = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve(buffer.toString('base64'));
      });
    }).on('error', reject);
  });
}

/**
 * Build vision analysis prompt based on agent type
 * Tailors the analysis request to what each agent needs
 */
function buildVisionPrompt(agentType: AgentType, userMessage?: string): string {
  const basePrompt = `Analyze this image and provide a detailed assessment.`;

  const agentSpecificPrompts: Record<AgentType, string> = {
    design: `${basePrompt}

Focus on:
1. Design elements (colors, typography, layout, composition)
2. Visual hierarchy and balance
3. Color psychology and brand alignment
4. UI/UX usability considerations
5. Design patterns and best practices

Identify any:
- Design violations or improvements needed
- Consistency issues
- Accessibility concerns (contrast, size, clarity)
- Modern design trends that apply

Confidence: Rate your analysis confidence from 0-100.
Detected Type: Is this a mockup, wireframe, prototype, or other design asset?

End with JSON:
{
  "key_points": ["insight 1", "insight 2", "..."],
  "detected_type": "design",
  "confidence": 85
}`,

    analyst: `${basePrompt}

Focus on:
1. Data visualization clarity and effectiveness
2. Chart types and appropriateness
3. Data accuracy and representation
4. Key metrics and insights visible
5. Statistical validity

Identify:
- Missing or misleading data elements
- Opportunities for better visualization
- Trends and patterns in the data
- Data quality issues
- KPI alignment

Confidence: Rate your analysis confidence from 0-100.
Detected Type: Is this a chart, dashboard, report, or other data visualization?

End with JSON:
{
  "key_points": ["insight 1", "insight 2", "..."],
  "detected_type": "data",
  "confidence": 85
}`,

    coder: `${basePrompt}

Focus on:
1. Code quality and structure
2. Syntax and language identification
3. Error messages or debugging information
4. Performance implications
5. Security vulnerabilities

Identify:
- Anti-patterns or bad practices
- Possible bugs or issues
- Code optimization opportunities
- Framework/library usage
- DevOps/deployment concerns

Confidence: Rate your analysis confidence from 0-100.
Detected Type: Is this source code, error log, terminal output, or stack trace?

End with JSON:
{
  "key_points": ["insight 1", "insight 2", "..."],
  "detected_type": "code",
  "confidence": 85
}`,

    marketing: `${basePrompt}

Focus on:
1. Brand messaging and tone
2. Target audience alignment
3. Visual appeal and engagement potential
4. Call-to-action clarity
5. Market positioning

Identify:
- Campaign effectiveness factors
- Content quality and relevance
- Audience sentiment triggers
- Competitive differentiation
- Conversion optimization opportunities

Confidence: Rate your analysis confidence from 0-100.
Detected Type: Is this a social media post, ad, landing page screenshot, or marketing material?

End with JSON:
{
  "key_points": ["insight 1", "insight 2", "..."],
  "detected_type": "other",
  "confidence": 85
}`,
  };

  let prompt = agentSpecificPrompts[agentType];

  if (userMessage) {
    prompt += `\n\nUser's specific question: ${userMessage}`;
  }

  return prompt;
}

/**
 * Parse Claude's vision analysis response
 * Extracts structured data from the response
 */
function parseVisionAnalysis(
  responseText: string,
  agentType: AgentType
): VisionAnalysisResult {
  // Extract JSON at the end of response
  const jsonMatch = responseText.match(/\{[\s\S]*\}(?![\s\S]*\{)/);
  let parsedData = {
    key_points: [],
    detected_type: getDefaultDetectedType(agentType),
    confidence: 50,
  };

  if (jsonMatch) {
    try {
      parsedData = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.warn('Failed to parse vision analysis JSON:', e);
    }
  }

  // Remove JSON from response to get clean analysis
  const analysisText = responseText.replace(/\{[\s\S]*\}(?![\s\S]*\{)/, '').trim();

  // Create summary (first 2-3 sentences)
  const sentences = analysisText.split(/[.!?]+/).filter((s) => s.trim());
  const summary = sentences.slice(0, 2).join('. ').trim() + (sentences.length > 2 ? '.' : '');

  return {
    analysis: analysisText || 'Analysis completed',
    summary: summary || 'Image analyzed successfully',
    detectedType: (parsedData.detected_type || getDefaultDetectedType(agentType)) as
      | 'design'
      | 'data'
      | 'code'
      | 'other',
    confidence: Math.min(100, Math.max(0, Number(parsedData.confidence) || 50)),
    keyPoints: Array.isArray(parsedData.key_points) ? parsedData.key_points : [],
    metadata: {
      agentType,
      analyzedAt: new Date().toISOString(),
      raw: responseText.substring(0, 500), // Store first 500 chars for debugging
    },
  };
}

/**
 * Get default detected type for agent
 */
function getDefaultDetectedType(agentType: AgentType): 'design' | 'data' | 'code' | 'other' {
  switch (agentType) {
    case 'design':
      return 'design';
    case 'analyst':
      return 'data';
    case 'coder':
      return 'code';
    default:
      return 'other';
  }
}

/**
 * Build vision-enabled message content for Anthropic API
 * Creates proper image blocks for Claude messages
 */
export function buildVisionMessageContent(
  userMessage: string,
  imageBase64: string,
  mimeType: string
): Anthropic.MessageParam['content'] {
  return [
    {
      type: 'text',
      text: userMessage,
    },
    {
      type: 'image',
      source: {
        type: 'base64',
        media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
        data: imageBase64,
      },
    },
  ];
}

/**
 * Extract image dimensions from base64 or file
 * Useful for metadata storage
 */
export function getImageDimensions(base64Data: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    // This is a simplified version - in production, use a library like probe-image-size
    // For now, return default dimensions
    resolve({ width: 0, height: 0 });
  });
}

/**
 * Invalidate vision analysis cache for an image
 */
export async function invalidateVisionCache(imageHash: string, agentType?: AgentType): Promise<void> {
  try {
    const pattern = agentType ? `vision:${agentType}:${imageHash}*` : `vision:*${imageHash}*`;
    // Note: Redis REST API doesn't support pattern deletion natively
    // This is a placeholder for manual cache invalidation
    if (agentType) {
      await redis.del(`vision:${agentType}:${imageHash}`);
    }
  } catch (error) {
    console.error('Failed to invalidate vision cache:', error);
  }
}
