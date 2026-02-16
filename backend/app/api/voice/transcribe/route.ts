
import { NextRequest } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// POST /api/voice/transcribe
// Receives audio blob from frontend, sends to ElevenLabs STT, returns text
export async function POST(req: NextRequest) {
    try {
        const apiKey = process.env.ELEVENLABS_API_KEY;
        if (!apiKey) {
            return Response.json(
                { error: 'ElevenLabs API key not configured' },
                { status: 503 }
            );
        }

        // Get the audio file from the request
        const formData = await req.formData();
        const audioFile = formData.get('audio') as File | null;

        if (!audioFile) {
            return Response.json(
                { error: 'No audio file provided' },
                { status: 400 }
            );
        }

        // Forward to ElevenLabs Speech-to-Text API
        const elevenLabsForm = new FormData();
        elevenLabsForm.append('file', audioFile);
        elevenLabsForm.append('model_id', 'scribe_v2');
        elevenLabsForm.append('language_code', 'th'); // Thai language

        const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
            method: 'POST',
            headers: {
                'xi-api-key': apiKey,
            },
            body: elevenLabsForm,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('ElevenLabs STT error:', response.status, errorText);
            return Response.json(
                { error: `Transcription failed: ${response.status}` },
                { status: response.status }
            );
        }

        const result = await response.json();

        return Response.json({
            text: result.text || '',
            language: result.language_code || 'th',
        });

    } catch (error) {
        console.error('Voice transcription error:', error);
        return Response.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
