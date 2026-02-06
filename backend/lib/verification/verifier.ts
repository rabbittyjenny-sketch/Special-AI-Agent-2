
import Anthropic from '@anthropic-ai/sdk';
import { AgentMemory, VerificationResult } from '../types.js';

// 🔥 Verify before sending to user
export async function verifyResponse(
    agentType: string,
    response: string,
    context: any,
    memory: AgentMemory
): Promise<VerificationResult> {

    const checks: VerificationResult = {
        passed: true,
        confidence: 100,
        issues: [],
        warnings: [],
        shouldEscalate: false
    };

    // Rule 1: Check against learned patterns
    for (const pattern of memory.patterns) {
        if (pattern.confidence > 0.8) {
            const followsPattern = await checkPattern(response, pattern.pattern);
            if (!followsPattern) {
                checks.warnings.push(`May not follow pattern: ${pattern.pattern}`);
                checks.confidence -= 10;
            }
        }
    }

    // Rule 2: Agent-specific verification
    const agentChecks = await runAgentSpecificChecks(agentType, response, context);
    checks.issues.push(...(agentChecks.issues || []));
    checks.warnings.push(...(agentChecks.warnings || []));
    checks.confidence = Math.min(checks.confidence, agentChecks.confidence || 100);

    // Rule 3: Custom user rules
    for (const rule of memory.verificationRules) {
        const ruleCheck = await checkRule(response, rule);
        if (!ruleCheck.passed) {
            checks.issues.push(`Failed rule: ${rule}`);
            checks.confidence -= 15;
        }
    }

    // Determine if should escalate
    if (checks.confidence < 70 || checks.issues.length > 0) {
        checks.shouldEscalate = true;
        checks.passed = false;
    }

    return checks;
}

// Agent-specific verification rules
async function runAgentSpecificChecks(
    agentType: string,
    response: string,
    context: any
): Promise<Partial<VerificationResult>> {

    switch (agentType) {
        case 'coder':
            return await verifyCode(response);
        case 'design':
            return await verifyDesign(response, context);
        case 'analyst':
            return await verifyAnalysis(response);
        case 'marketing':
            return await verifyMarketing(response);
        default:
            return { issues: [], warnings: [], confidence: 100 };
    }
}

// Code verification
async function verifyCode(code: string): Promise<Partial<VerificationResult>> {
    const checks: { issues: string[], warnings: string[], confidence: number } = { issues: [], warnings: [], confidence: 100 };

    // Check 1: Has error handling?
    if (!code.includes('try') && !code.includes('catch')) {
        checks.warnings.push('No error handling detected');
        checks.confidence -= 10;
    }

    // Check 2: Has comments?
    const commentRatio = (code.match(/\/\//g) || []).length / (code.split('\n').length || 1);
    if (commentRatio < 0.1) {
        checks.warnings.push('Code may need more comments');
        checks.confidence -= 5;
    }

    // Check 3: TypeScript syntax check (basic)
    if (code.includes('any') && code.split('any').length > 3) {
        checks.warnings.push('Too many "any" types - consider specific types');
    }

    return checks;
}

// Design verification
async function verifyDesign(response: string, context: any): Promise<Partial<VerificationResult>> {
    const checks: { issues: string[], warnings: string[], confidence: number } = { issues: [], warnings: [], confidence: 100 };

    // Check accessibility mentions
    if (!response.toLowerCase().includes('accessibility') &&
        !response.toLowerCase().includes('a11y')) {
        checks.warnings.push('Consider mentioning accessibility');
        checks.confidence -= 10;
    }

    // Check if brand guidelines referenced (if applicable)
    if (context?.brandGuidelines && !response.includes('brand')) {
        checks.warnings.push('Brand guidelines may not be considered');
    }

    return checks;
}

// Analysis verification
async function verifyAnalysis(response: string): Promise<Partial<VerificationResult>> {
    const checks: { issues: string[], warnings: string[], confidence: number } = { issues: [], warnings: [], confidence: 100 };

    // Check for data sources
    if (!response.includes('source') && !response.includes('data from')) {
        checks.issues.push('No data sources cited');
        checks.confidence -= 20;
    }

    // Check for numbers/statistics
    const hasNumbers = /\d+/.test(response);
    if (!hasNumbers && response.length > 200) {
        checks.warnings.push('Analysis may need specific numbers/metrics');
    }

    return checks;
}

// Marketing verification
async function verifyMarketing(response: string): Promise<Partial<VerificationResult>> {
    const checks: { issues: string[], warnings: string[], confidence: number } = { issues: [], warnings: [], confidence: 100 };

    // Check for CTA
    const ctaKeywords = ['click', 'learn more', 'sign up', 'get started', 'contact'];
    const hasCTA = ctaKeywords.some(kw => response.toLowerCase().includes(kw));

    if (!hasCTA) {
        checks.warnings.push('No clear call-to-action');
        checks.confidence -= 15;
    }

    // Check for hyperbole (avoid overpromising)
    const hyperboleWords = ['best', 'perfect', 'guaranteed', 'always', 'never'];
    const hyperboleCount = hyperboleWords.filter(w =>
        response.toLowerCase().includes(w)
    ).length;

    if (hyperboleCount > 2) {
        checks.warnings.push('May be overpromising - reduce superlatives');
        checks.confidence -= 10;
    }

    return checks;
}

// Check if response follows learned pattern
async function checkPattern(response: string, pattern: string): Promise<boolean> {
    // Simple keyword matching
    const keywords = pattern.toLowerCase().split(' ');
    const matchCount = keywords.filter(kw =>
        response.toLowerCase().includes(kw)
    ).length;

    return matchCount / keywords.length > 0.5;
}

// Check custom rule
async function checkRule(response: string, rule: string): Promise<{ passed: boolean }> {
    // ใช้ Claude mini ตรวจสอบ rule
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

    const check = await anthropic.messages.create({
        model: "claude-3-haiku-20240307", // Corrected model
        max_tokens: 50,
        messages: [{
            role: "user",
            content: `Does this response follow the rule: "${rule}"?

Response: "${response}"

Answer: yes or no only`
        }]
    });

    const content = check.content[0];
    if (content.type !== 'text') return { passed: false };

    return { passed: content.text.toLowerCase().includes('yes') };
}
