
import { processAgentRequest } from '@/lib/agent/orchestrator';
import { Attachment } from '@/lib/types';

/**
 * Phase 2: Chat endpoint with vision analysis support
 * - Accepts multiple attachments (up to 5 images)
 * - Processes images through Claude Vision API
 * - Creates KB entries for high-confidence analyses
 * - Returns vision metrics in response
 */
export async function POST(req: Request) {
    try {
        const {
            conversationId,
            userId,
            agentType,
            message,
            attachments,
            autoDetectAgent,
            attachmentMetadata // Phase 2: Additional metadata
        } = await req.json();

        // Validate
        if (!conversationId || !userId || !message) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const targetAgent = agentType || 'coder';

        // Phase 2: Log attachment count
        if (attachments && attachments.length > 0) {
            console.log(`📎 Chat request with ${attachments.length} attachment(s)`);
        }

        // 🔥 Process request (all magic happens here in orchestrator.ts)
        // The orchestrator now handles:
        // 1. Vision API analysis for each attachment
        // 2. KB entry creation for high-confidence results
        // 3. Tracking vision metrics
        const result = await processAgentRequest({
            conversationId,
            userId,
            agentType: targetAgent,
            userMessage: message,
            attachments: attachments as Attachment[] | undefined,
            autoDetectAgent: autoDetectAgent === true
        });

        // Phase 2: Enhanced response with vision metrics
        return Response.json({
            success: true,
            data: {
                message: result.message,
                confidence: result.confidence,
                verified: result.verified,
                needsReview: result.escalated,
                reviewReason: result.escalationReason,
                warnings: result.warnings,
                detectedAgent: result.detectedAgent
            },
            // Phase 2: Include vision analysis metrics
            metadata: {
                tokensUsed: result.metadata.tokensUsed,
                processingTime: result.metadata.processingTime,
                retryCount: result.metadata.retryCount,
                attachmentsProcessed: result.metadata.attachmentsProcessed,
                // Phase 2: Vision metrics
                visionAnalysesCreated: result.metadata.visionAnalysesCreated || 0,
                kbEntriesCreated: result.metadata.kbEntriesCreated || 0
            }
        });

    } catch (error) {
        console.error('Chat API error:', error);
        return Response.json(
            {
                error: 'Internal server error',
                details: String(error)
            },
            { status: 500 }
        );
    }
}
