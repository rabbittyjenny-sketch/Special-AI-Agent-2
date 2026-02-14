
import { neon } from '@neondatabase/serverless';
import Anthropic from '@anthropic-ai/sdk';
import { AgentMemory } from '../types.js';

const sql = neon(process.env.DATABASE_URL!);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// ✅ Get user memory (Fixed to match schema 'user_memory')
export async function getUserMemory(
    userId: string,
    agentType: string
): Promise<AgentMemory> {
    const result = await sql`
    SELECT preferences, learned_patterns, interaction_count 
    FROM user_memory
    WHERE user_id = ${userId} AND agent_type = ${agentType}
  `;

    if (result.length === 0) {
        return getDefaultMemory(userId, agentType);
    }

    const row = result[0];
    return {
        userId,
        agentType,
        preferences: row.preferences || { outputStyle: 'concise', tone: 'professional' },
        patterns: row.learned_patterns || [],
        lessonsLearned: [], // Not in current schema, defaulting to empty
        verificationRules: [], // Not in current schema, defaulting to empty
        updatedAt: new Date().toISOString()
    } as AgentMemory;
}

// ✅ Learn from interaction (Async)
export async function learnFromInteraction(
    userId: string,
    agentType: string,
    interaction: {
        userMessage: string;
        assistantResponse: string;
        wasApproved: boolean;
        confidence: number;
    }
) {
    const memory = await getUserMemory(userId, agentType);

    // 🤖 Fast Analysis with Claude Haiku
    const analysisResponse = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        messages: [{
            role: "user",
            content: `Analyze this AI interaction for learning:
User: "${interaction.userMessage}"
Assistant: "${interaction.assistantResponse}"
Approved: ${interaction.wasApproved}

Extract JSON Only:
{
  "preferenceSignals": { "outputStyle": "concise|detailed|null" },
  "newPattern": "one sentence description or null"
}
`
        }]
    });

    const content = analysisResponse.content[0];
    if (content.type !== 'text') return;

    try {
        const analysis = JSON.parse(content.text);

        // Update preferences
        if (analysis.preferenceSignals?.outputStyle) {
            memory.preferences.outputStyle = analysis.preferenceSignals.outputStyle;
        }

        // Add pattern
        if (analysis.newPattern && analysis.newPattern !== "null") {
            memory.patterns.push({
                pattern: analysis.newPattern,
                examples: [interaction.assistantResponse.slice(0, 100)],
                confidence: 0.7
            });
        }

        // Save back to Neon (Fixed table user_memory)
        await sql`
      INSERT INTO user_memory (user_id, agent_type, preferences, learned_patterns, interaction_count, updated_at)
      VALUES (
        ${userId}, 
        ${agentType}, 
        ${JSON.stringify(memory.preferences)}, 
        ${JSON.stringify(memory.patterns)}, 
        ${(memory.interactionCount || 0) + 1},
        NOW()
      )
      ON CONFLICT (user_id, agent_type)
      DO UPDATE SET 
        preferences = ${JSON.stringify(memory.preferences)}, 
        learned_patterns = ${JSON.stringify(memory.patterns)},
        interaction_count = user_memory.interaction_count + 1,
        updated_at = NOW()
    `;
    } catch (e) {
        console.error("Learning Error:", e);
    }
}

function getDefaultMemory(userId: string, agentType: string): AgentMemory {
    return {
        userId,
        agentType,
        preferences: { outputStyle: 'concise', tone: 'professional' },
        patterns: [],
        lessonsLearned: [],
        verificationRules: []
    };
}
