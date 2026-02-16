'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

export function useVoiceHook() {
    const [voiceEnabled, setVoiceEnabled] = useState(true);
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [input, setInput] = useState('');

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const toggleVoice = () => setVoiceEnabled(prev => !prev);

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            audioChunksRef.current = [];
            mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
            mediaRecorder.onstop = async () => {
                stream.getTracks().forEach(t => t.stop());
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                if (audioBlob.size < 100) return;
                setIsTranscribing(true);
                try {
                    const formData = new FormData();
                    formData.append('audio', audioBlob, 'recording.webm');
                    const res = await fetch('/api/voice/transcribe', { method: 'POST', body: formData });
                    if (res.ok) {
                        const result = await res.json();
                        if (result.text?.trim()) setInput(prev => prev ? `${prev} ${result.text}` : result.text);
                    }
                } finally {
                    setIsTranscribing(false);
                }
            };
            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error('Mic access denied:', err);
            setVoiceEnabled(false);
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current?.state !== 'inactive') {
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
        }
    }, []);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Prevent activation when typing in input/textarea
            const activeTag = document.activeElement?.tagName;
            if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;

            // Ctrl+Space to start recording (push-to-talk)
            if (e.ctrlKey && e.code === 'Space' && voiceEnabled && !isRecording) {
                e.preventDefault();
                startRecording();
            }

            // Escape to clear input
            if (e.code === 'Escape' && input.trim()) {
                e.preventDefault();
                setInput('');
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            const activeTag = document.activeElement?.tagName;
            if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;

            // Release Ctrl+Space to stop recording
            if (e.ctrlKey && e.code === 'Space' && isRecording) {
                e.preventDefault();
                stopRecording();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [voiceEnabled, isRecording, input, startRecording, stopRecording]);

    return {
        voiceEnabled,
        toggleVoice,
        isRecording,
        startRecording,
        stopRecording,
        isTranscribing,
        input,
        setInput
    };
}
