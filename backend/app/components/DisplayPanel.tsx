'use client';

import React, { useEffect, useState } from 'react';
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
        <div className="h-full bg-white rounded-[32px] shadow-soft p-10 flex flex-col relative overflow-hidden font-sans border border-slate-100">

            {/* Header */}
            <header className="flex justify-between items-end pb-8 mb-4 border-b border-slate-50 relative z-10 w-full flex-shrink-0">
                <div>
                    <div className="flex items-center gap-4">
                        <h2 className="type-h2 text-slate-800 tracking-tight">{activeAgent?.label}</h2>
                        <div
                            className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-50 border border-slate-100"
                            style={{ color: getHexColor(activeAgent?.color || 'bg-[#3b82f6]') }}
                        >
                            {activeAgent?.role}
                        </div>
                    </div>
                    <p className="type-body text-sm mt-3 opacity-60 max-w-md line-clamp-2">
                        AI Assistant powered by STRATEGIC BRAIN & Verified Logic (Version 2.0).
                        System ready for complex tasks.
                    </p>
                </div>

                {/* Status */}
                <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${messages.length > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                        <span className="type-label text-slate-400">STATUS: {messages.length > 0 ? 'ACTIVE' : 'IDLE'}</span>
                    </div>
                    <span className="type-label text-[10px] opacity-40 font-mono tracking-widest">SESSION: {sessionId}</span>
                </div>
            </header>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto pr-6 scrollbar-thin space-y-8 pb-24 relative z-0">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-40 select-none">
                        <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-inner animate-pulse">
                            <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                        </div>
                        <h3 className="type-h2 text-slate-300 mb-2">Awaiting Input</h3>
                        <p className="type-body text-sm text-slate-300 max-w-xs mx-auto leading-6">
                            Select an agent from the Command Center on the left to begin your session.
                        </p>
                    </div>
                ) : (
                    messages.map((msg, i) => (
                        <div key={i} className={`flex flex-col gap-3 ${msg.role === 'user' ? 'items-end pl-20' : 'items-start pr-20'} group animate-fade-in`}>

                            {/* Label */}
                            <div className="flex items-center gap-3 opacity-60 px-2 transition-opacity duration-300 group-hover:opacity-100">
                                <span className={`type-label text-[10px] ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                                    {msg.role === 'user' ? 'YOU (USER)' : `AI (${activeAgent?.label.toUpperCase()})`}
                                </span>
                                <span className="w-8 h-[1px] bg-slate-200"></span>
                            </div>

                            {/* Bubble */}
                            <div className={`p-8 w-full shadow-sm text-lg leading-8 transition-all duration-300 relative group-hover:shadow-md ${msg.role === 'user'
                                ? 'bg-slate-800 rounded-[24px] rounded-tr-sm'
                                : 'bg-slate-50 border border-slate-100 text-slate-600 rounded-[24px] rounded-tl-sm shadow-soft-sm'
                                }`}>
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
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {msg.attachments.map((att, idx) => (
                                                    <div key={idx} className="relative group/img">
                                                        {att.metadata?.base64 && att.mimeType.startsWith('image/') ? (
                                                            <img
                                                                src={`data:${att.mimeType};base64,${att.metadata.base64}`}
                                                                alt={att.filename}
                                                                className="max-w-sm rounded-lg shadow-md hover:shadow-lg transition-shadow"
                                                            />
                                                        ) : (
                                                            <div className="px-3 py-2 bg-white/10 rounded-lg text-xs">
                                                                📎 {att.filename}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
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
                                    <div className="mt-6 pt-4 border-t border-slate-100/10 flex flex-wrap gap-3 items-center">
                                        {msg.metadata.verified && (
                                            <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                                <span className="type-label text-emerald-600 text-[9px]">VERIFIED LOGIC</span>
                                            </div>
                                        )}
                                        {msg.metadata.confidence && (
                                            <span className="type-label text-slate-400 text-[9px]">CONFIDENCE: {msg.metadata.confidence}%</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}

                {/* Loading State */}
                {loading && (
                    <div className="flex flex-col items-start gap-3 mt-4 animate-pulse">
                        <span className="type-label text-slate-300 px-2">SYSTEM PROCESSING</span>
                        <div className="bg-white border border-slate-100 rounded-[24px] rounded-tl-sm p-6 w-fit shadow-soft-sm flex items-center gap-4">
                            <div className="flex gap-1.5">
                                <div className="w-2.5 h-2.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-2.5 h-2.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-2.5 h-2.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                            <span className="type-label text-slate-500 tracking-wider">GENERATING RESPONSE...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

        </div>
    );
}
