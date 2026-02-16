import { addKBEntry, KnowledgeEntry } from '@/lib/agent/knowledge-manager';
import { AgentType } from '@/lib/agent/boundaries';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * POST /api/knowledge/add
 * Add new knowledge base entry
 *
 * Body:
 * {
 *   "agentType": "design" | "analyst" | "coder" | "marketing" | "orchestrator",
 *   "sourceType": "manual" | "google_sheets" | "api" | "file_upload",
 *   "category": "brand_voice" | "techniques" | "best_practices" | etc.,
 *   "key": "Topic Title",
 *   "value": "Content here...",
 *   "metadata": { "priority": "high" },
 *   "isActive": true
 * }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate required fields
    const { agentType, sourceType, category, key, value } = body;

    if (!agentType || !sourceType || !category || !key || !value) {
      return Response.json(
        {
          error: 'Missing required fields',
          required: ['agentType', 'sourceType', 'category', 'key', 'value']
        },
        { status: 400 }
      );
    }

    // Validate agentType
    const validAgentTypes: AgentType[] = ['design', 'analyst', 'coder', 'marketing', 'orchestrator'];
    if (!validAgentTypes.includes(agentType)) {
      return Response.json(
        {
          error: 'Invalid agentType',
          valid: validAgentTypes
        },
        { status: 400 }
      );
    }

    // Create entry
    const entry: Omit<KnowledgeEntry, 'id' | 'createdAt' | 'updatedAt'> = {
      agentType,
      sourceType,
      category,
      key,
      value,
      metadata: body.metadata || {},
      isActive: body.isActive !== false,
      syncedAt: new Date().toISOString()
    };

    const result = await addKBEntry(entry);

    return Response.json({
      success: true,
      message: 'Knowledge base entry added successfully',
      data: result
    });

  } catch (error) {
    console.error('Knowledge Add Error:', error);
    return Response.json(
      {
        error: 'Failed to add knowledge base entry',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/knowledge/add
 * Show API documentation
 */
export async function GET() {
  return Response.json({
    endpoint: 'POST /api/knowledge/add',
    description: 'Add new knowledge base entry',
    requiredFields: {
      agentType: 'design | analyst | coder | marketing | orchestrator',
      sourceType: 'manual | google_sheets | api | file_upload',
      category: 'brand_voice | techniques | best_practices | custom',
      key: 'Topic Title (string)',
      value: 'Content (text)'
    },
    optionalFields: {
      metadata: 'JSON object with additional data',
      isActive: 'boolean (default: true)'
    },
    example: {
      agentType: 'design',
      sourceType: 'manual',
      category: 'brand_voice',
      key: 'iDEAS365 Tone - Creative',
      value: 'Use energetic and inspiring language...',
      metadata: { priority: 'high', language: 'th-en' },
      isActive: true
    }
  });
}
