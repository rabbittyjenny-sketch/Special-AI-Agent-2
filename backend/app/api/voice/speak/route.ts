
import { NextRequest } from 'next/server';

const SKILLBOSS_API_URL = 'https://api.heybossai.com/v1';

// POST /api/voice/speak
// Receives text, returns audio via SkillBoss TTS (minimax/speech-01-turbo)
export async function POST(req: NextRequest) {
    try {
        const apiKey = process.env.SKILLBOSS_API_KEY || process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            return Response.json(
                { error: 'SkillBoss API key not configured' },
                { status: 503 }
            );
        }

        const { text } = await req.json();

        if (!text?.trim()) {
            return Response.json(
                { error: 'No text provided' },
                { status: 400 }
            );
        }

        // Truncate very long text to avoid excessive TTS costs
        const truncatedText = text.length > 1000 ? text.slice(0, 1000) + '...' : text;

        const response = await fetch(`${SKILLBOSS_API_URL}/run`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'minimax/speech-01-turbo',
                inputs: {
                    text: truncatedText,
                    voice_setting: {
                        voice_id: 'female-shaonv',
                        speed: 1.0,
                        vol: 1.0,
                        pitch: 0,
                    },
                },
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('TTS error:', response.status, errorText);

            if (response.status === 402) {
                return Response.json(
                    { error: 'SkillBoss credits exhausted. Visit https://www.skillboss.co/ to add credits.' },
                    { status: 402 }
                );
            }

            return Response.json(
                { error: `TTS failed: ${response.status}` },
                { status: response.status }
            );
        }

        // Return binary audio data
        const audioBuffer = await response.arrayBuffer();

        return new Response(audioBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'audio/mpeg',
                'Cache-Control': 'public, max-age=3600',
            },
        });

    } catch (error) {
        console.error('TTS error:', error);
        return Response.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
