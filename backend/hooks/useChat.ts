'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

// Types
export interface Attachment {
    id: string;
    filename: string;
    mimeType: string;
    size: number;
    url: string;
    storageKey: string;
    metadata?: {
        base64?: string;
        [key: string]: any;
    };
}

export interface Message {
    role: 'user' | 'assistant';
    content: string;
    attachments?: Attachment[];
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
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string>('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initialize conversationId from localStorage or create new
    useEffect(() => {
        // Try to load existing conversationId from localStorage
        const stored = typeof window !== 'undefined' ? localStorage.getItem('conversationId') : null;

        if (stored) {
            // Resume existing conversation
            console.log('📝 Resuming conversation:', stored);
            setConversationId(stored);
        } else {
            // Create new conversation
            const newId = crypto.randomUUID();
            if (typeof window !== 'undefined') {
                localStorage.setItem('conversationId', newId);
            }
            console.log('🆕 New conversation:', newId);
            setConversationId(newId);
        }
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const handleUpload = useCallback(async (files: File[]) => {
        if (!files.length) return;

        // Clear previous errors
        setUploadError('');
        setIsUploading(true);

        try {
            // Validate file size (5MB max per file)
            const maxSize = 5 * 1024 * 1024; // 5MB
            const oversizedFiles = files.filter(f => f.size > maxSize);
            if (oversizedFiles.length > 0) {
                throw new Error(`ไฟล์ใหญ่เกิน 5MB: ${oversizedFiles.map(f => f.name).join(', ')}`);
            }

            const formData = new FormData();
            files.forEach(file => formData.append('file', file));
            formData.append('userId', 'null'); // Will be updated when message is sent
            formData.append('conversationId', 'null'); // Will be updated when message is sent

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || `เกิดข้อผิดพลาด (${res.status})`);
            }

            const result = await res.json();

            if (result.success && result.attachments) {
                setAttachments(prev => [...prev, ...result.attachments]);
            } else if (result.errors && result.errors.length > 0) {
                setUploadError(result.errors.join(', '));
            }
        } catch (error) {
            console.error('Upload error:', error);
            setUploadError(error instanceof Error ? error.message : 'ไม่สามารถอัปโหลดไฟล์ได้');
        } finally {
            setIsUploading(false);
        }
    }, [conversationId]);

    const removeAttachment = useCallback((id: string) => {
        setAttachments(prev => prev.filter(a => a.id !== id));
    }, []);

    const sendMessage = useCallback(async (agentType: string) => {
        if (!input.trim() && attachments.length === 0) return;

        const userMessage = input;
        const currentAttachments = [...attachments];

        setInput('');
        setAttachments([]); // Clear attachments immediately
        setLoading(true);

        // Add user message immediately
        setMessages(prev => [...prev, {
            role: 'user',
            content: userMessage,
            attachments: currentAttachments
        }]);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversationId,
                    userId: '00000000-0000-0000-0000-000000000000',
                    agentType,
                    message: userMessage,
                    attachments: currentAttachments
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
    }, [input, conversationId, attachments]);

    // Start a new conversation (clear localStorage and reset state)
    const startNewConversation = useCallback(() => {
        const newId = crypto.randomUUID();
        if (typeof window !== 'undefined') {
            localStorage.setItem('conversationId', newId);
        }
        console.log('🔄 Starting new conversation:', newId);
        setConversationId(newId);
        setMessages([]);
        setAttachments([]);
        setInput('');
    }, []);

    return {
        messages,
        input,
        setInput,
        loading,
        sendMessage,
        messagesEndRef,
        attachments,
        isUploading,
        uploadError,
        handleUpload,
        removeAttachment,
        startNewConversation,
        conversationId
    };
}
