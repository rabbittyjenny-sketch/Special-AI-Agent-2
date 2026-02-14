'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { agentOptions } from '@/config/agents';
import { Message } from '@/hooks/useChat';

interface DisplayPanelProps {
    currentAgent: string;
    messages: Message[];
    loading: boolean;
    messagesEndRef: React.RefObject<HTMLDivElement>;
}

export function DisplayPanel({
    currentAgent,
    messages,
    loading,
    messagesEndRef
}: DisplayPanelProps) {

    const activeAgent = agentOptions.find(a => a.value === currentAgent);
    const [sessionId, setSessionId] = useState<string>('LOADING...');

    // Helper
    const getHexColor = (bgClass: string) => {
        return bgClass.replace('bg-[', '').replace(']', '');
    };

    useEffect(() => {
        setSessionId(Math.random().toString(36).substr(2, 6).toUpperCase());
    }, []);

    return (
        <motion.div
            className="h-full bg-white rounded-[32px] shadow-soft p-10 flex flex-col relative overflow-hidden font-sans border border-slate-100"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
        >

            {/* Header */}
            <motion.header
                className="flex justify-between items-end pb-8 mb-4 border-b border-slate-50 relative z-10 w-full flex-shrink-0"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
            >
                <div>
                    <motion.div
                        className="flex items-center gap-4"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                    >
                        <h2 className="type-h2 text-slate-800 tracking-tight">{activeAgent?.label}</h2>
                        <motion.div
                            className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-50 border border-slate-100"
                            style={{ color: getHexColor(activeAgent?.color || 'bg-[#3b82f6]') }}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4, duration: 0.5 }}
                        >
                            {activeAgent?.role}
                        </motion.div>
                    </motion.div>
                    <motion.p
                        className="type-body text-sm mt-3 opacity-60 max-w-md line-clamp-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.6 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                    >
                        AI Assistant powered by STRATEGIC BRAIN & Verified Logic (Version 2.0).
                        System ready for complex tasks.
                    </motion.p>
                </div>

                {/* Status */}
                <motion.div
                    className="flex flex-col items-end gap-2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                >
                    <div className="flex items-center gap-2">
                        <motion.span
                            className={`w-2 h-2 rounded-full ${messages.length > 0 ? 'bg-emerald-500' : 'bg-slate-300'}`}
                            animate={messages.length > 0 ? {
                                scale: [1, 1.3, 1],
                                opacity: [1, 0.7, 1]
                            } : {}}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                        <span className="type-label text-slate-400">STATUS: {messages.length > 0 ? 'ACTIVE' : 'IDLE'}</span>
                    </div>
                    <span className="type-label text-[10px] opacity-40 font-mono tracking-widest">SESSION: {sessionId}</span>
                </motion.div>
            </motion.header>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto pr-6 scrollbar-thin space-y-8 pb-24 relative z-0">
                <AnimatePresence mode="sync">
                    {messages.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 0.4, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.5 }}
                            className="h-full flex flex-col items-center justify-center text-center select-none"
                        >
                            <motion.div
                                className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-inner"
                                animate={{
                                    scale: [1, 1.05, 1],
                                    opacity: [0.5, 0.7, 0.5]
                                }}
                                transition={{ duration: 3, repeat: Infinity }}
                            >
                                <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                            </motion.div>
                            <h3 className="type-h2 text-slate-300 mb-2">Awaiting Input</h3>
                            <p className="type-body text-sm text-slate-300 max-w-xs mx-auto leading-6">
                                Select an agent from the Command Center on the left to begin your session.
                            </p>
                        </motion.div>
                    ) : (
                        messages.map((msg, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                                transition={{ delay: i * 0.05, duration: 0.5 }}
                                className={`flex flex-col gap-3 ${msg.role === 'user' ? 'items-end pl-20' : 'items-start pr-20'} group`}
                            >

                            {/* Label */}
                            <motion.div
                                className="flex items-center gap-3 opacity-60 px-2"
                                whileHover={{ opacity: 1 }}
                                transition={{ duration: 0.2 }}
                            >
                                <span className={`type-label text-[10px] ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                                    {msg.role === 'user' ? 'YOU (USER)' : `AI (${activeAgent?.label.toUpperCase()})`}
                                </span>
                                <motion.span
                                    className="w-8 h-[1px] bg-slate-200"
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: 1 }}
                                    transition={{ delay: i * 0.05 + 0.3, duration: 0.4 }}
                                />
                            </motion.div>

                            {/* Bubble */}
                            <motion.div
                                className={`p-8 w-full shadow-sm text-lg leading-8 relative ${msg.role === 'user'
                                    ? 'bg-slate-800 rounded-[24px] rounded-tr-sm'
                                    : 'bg-slate-50 border border-slate-100 text-slate-600 rounded-[24px] rounded-tl-sm shadow-soft-sm'
                                    }`}
                                whileHover={{ scale: 1.01, boxShadow: "0 10px 40px rgba(0,0,0,0.1)" }}
                                transition={{ duration: 0.2 }}
                            >
                                {msg.role === 'assistant' ? (
                                    // AI Text - Deep Gray (slate-600) for comfort
                                    <div className="prose prose-slate prose-lg max-w-none text-slate-600 font-medium">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                                    </div>
                                ) : (
                                    // User Text - Pure White
                                    <>
                                        {/* Attachments */}
                                        {msg.attachments && msg.attachments.length > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.2 }}
                                                className="flex flex-wrap gap-2 mb-4"
                                            >
                                                {msg.attachments.map((att, idx) => (
                                                    <motion.div
                                                        key={idx}
                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ delay: idx * 0.1 }}
                                                        whileHover={{ scale: 1.05, rotate: 1 }}
                                                        className="relative group/img"
                                                    >
                                                        {att.metadata?.base64 && att.mimeType.startsWith('image/') ? (
                                                            <img
                                                                src={`data:${att.mimeType};base64,${att.metadata.base64}`}
                                                                alt={att.filename}
                                                                className="max-w-sm rounded-lg shadow-md"
                                                            />
                                                        ) : (
                                                            <div className="px-3 py-2 bg-white/10 rounded-lg text-xs">
                                                                📎 {att.filename}
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                ))}
                                            </motion.div>
                                        )}

                                        <div
                                            className="whitespace-pre-wrap font-semibold type-body"
                                            style={{ color: '#FFFFFF' }}
                                        >
                                            {msg.content}
                                        </div>
                                    </>
                                )}

                                {/* Metadata */}
                                {msg.metadata && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4 }}
                                        className="mt-6 pt-4 border-t border-slate-100/10 flex flex-wrap gap-3 items-center"
                                    >
                                        {msg.metadata.verified && (
                                            <motion.div
                                                initial={{ scale: 0.8 }}
                                                animate={{ scale: 1 }}
                                                transition={{ delay: 0.5, type: "spring" }}
                                                className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-2"
                                            >
                                                <motion.span
                                                    className="w-1.5 h-1.5 bg-emerald-500 rounded-full"
                                                    animate={{
                                                        scale: [1, 1.3, 1],
                                                        opacity: [1, 0.7, 1]
                                                    }}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                />
                                                <span className="type-label text-emerald-600 text-[9px]">VERIFIED LOGIC</span>
                                            </motion.div>
                                        )}
                                        {msg.metadata.confidence && (
                                            <motion.span
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 0.6 }}
                                                className="type-label text-slate-400 text-[9px]"
                                            >
                                                CONFIDENCE: {msg.metadata.confidence}%
                                            </motion.span>
                                        )}
                                    </motion.div>
                                )}
                            </motion.div>
                        </motion.div>
                    ))
                    )}
                </AnimatePresence>

                {/* Loading State */}
                <AnimatePresence>
                    {loading && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="flex flex-col items-start gap-3 mt-4"
                        >
                            <motion.span
                                className="type-label text-slate-300 px-2"
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            >
                                SYSTEM PROCESSING
                            </motion.span>
                            <motion.div
                                className="bg-white border border-slate-100 rounded-[24px] rounded-tl-sm p-6 w-fit shadow-soft-sm flex items-center gap-4"
                                animate={{ scale: [1, 1.01, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            >
                                <div className="flex gap-1.5">
                                    <motion.div
                                        className="w-2.5 h-2.5 bg-slate-400 rounded-full"
                                        animate={{ y: [0, -8, 0] }}
                                        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                                    />
                                    <motion.div
                                        className="w-2.5 h-2.5 bg-slate-400 rounded-full"
                                        animate={{ y: [0, -8, 0] }}
                                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
                                    />
                                    <motion.div
                                        className="w-2.5 h-2.5 bg-slate-400 rounded-full"
                                        animate={{ y: [0, -8, 0] }}
                                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
                                    />
                                </div>
                                <span className="type-label text-slate-500 tracking-wider">GENERATING RESPONSE...</span>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>

        </motion.div>
    );
}
