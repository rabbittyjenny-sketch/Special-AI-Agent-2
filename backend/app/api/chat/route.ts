
import { processAgentRequest } from '@/lib/agent/orchestrator';

// Force dynamic rendering to avoid build-time database connection errors
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const { conversationId, userId, agentType, message, attachments } = await req.json();

        // Validate
        if (!conversationId || !userId || !message) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const targetAgent = agentType || 'coder';

        // 🔥 Process request (all magic happens here)
        const result = await processAgentRequest({
            conversationId,
            userId,
            agentType: targetAgent,
            userMessage: message,
            attachments: attachments || [] // Pass attachments to orchestrator
        });

        // Return with all metadata
        return Response.json({
            success: true,
            data: {
                message: result.message,
                confidence: result.confidence,
                verified: result.verified,
                needsReview: result.escalated,
                reviewReason: result.escalationReason,
                warnings: result.warnings
            },
            metadata: result.metadata
        });

    } catch (error) {
        console.error('Chat API error:', error);
        return Response.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
