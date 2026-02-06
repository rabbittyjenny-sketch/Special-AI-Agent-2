
import { AgentMemory, Message, VerificationResult } from '../types.js';

export interface EscalationDecision {
    shouldEscalate: boolean;
    reason: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
}

// ✅ Decide if human review is needed
export async function decideEscalation(
    confidence: number,
    issues: string[],
    memory: AgentMemory
): Promise<EscalationDecision> {

    if (issues.length > 0) {
        return {
            shouldEscalate: true,
            reason: `Issues detected: ${issues.join(', ')}`,
            severity: 'critical'
        };
    }

    if (confidence < 70) {
        return {
            shouldEscalate: true,
            reason: `Confidence ${confidence}% is below threshold`,
            severity: 'high'
        };
    }

    return {
        shouldEscalate: false,
        reason: 'Quality passed',
        severity: 'low'
    };
}
