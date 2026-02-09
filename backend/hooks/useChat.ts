'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

// Types
export interface Message {
    role: 'user' | 'assistant';
    content: string;
    metadata?: {
        confidence?: number;
        verified?: boolean;
        warnings?: string[];
    };
}

export function useChat() {
    const [conversationId, setConversationId] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setConversationId(crypto.randomUUID());
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const sendMessage = useCallback(async (agentType: string) => {
        if (!input.trim()) return;

        const userMessage = input;
        setInput('');
        setLoading(true);

        // Add user message immediately
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversationId,
                    userId: '00000000-0000-0000-0000-000000000000',
                    agentType,
                    message: userMessage
                })
            });

            const result = await res.json();

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: result.data?.message || result.error || 'No response',
                metadata: result.data ? {
                    confidence: result.data.confidence,
                    verified: result.data.verified,
                    warnings: result.data.warnings
                } : undefined
            }]);
        } catch (error) {
            console.error('Chat Error:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Error: Cannot connect to the brain.',
                metadata: { confidence: 0, verified: false }
            }]);
        } finally {
            setLoading(false);
        }
    }, [input, conversationId]);

    return {
        messages,
        input,
        setInput,
        loading,
        sendMessage,
        messagesEndRef
    };
}
