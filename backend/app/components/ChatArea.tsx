'use client';

import React, { useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { agentOptions } from '@/config/agents';
import { Message } from '@/hooks/useChat';

interface ChatAreaProps {
    currentAgent: string;
    messages: Message[];
    loading: boolean;
    voiceEnabled: boolean;
    onToggleVoice: () => void;
    input: string;
    setInput: (value: string) => void;
    onSend: (agent: string) => void;
    isRecording: boolean;
    isTranscribing: boolean;
    onStartRecording: () => void;
    onStopRecording: () => void;
    messagesEndRef: React.RefObject<HTMLDivElement>;
    handleKeyDown: (e: React.KeyboardEvent) => void;
}

export function ChatArea({
    currentAgent,
    messages,
    loading,
    voiceEnabled,
    onToggleVoice,
    input,
    setInput,
    onSend,
    isRecording,
    isTranscribing,
    onStartRecording,
    onStopRecording,
    messagesEndRef,
    handleKeyDown
}: ChatAreaProps) {

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const activeAgent = agentOptions.find(a => a.value === currentAgent);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [input]);

    return (
        <div className="flex-1 h-full flex flex-col bg-slate-50 relative min-w-0 font-sans">
            {/* Header - Clean White */}
            <div className="flex justify-between items-center px-8 py-5 sticky top-0 bg-white/90 backdrop-blur-md z-10 border-b border-slate-200">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        {activeAgent?.label}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${activeAgent?.color} text-slate-800`}>
                            {activeAgent?.role}
                        </span>
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">Ready to assist.</p>
                </div>

                <button
                    onClick={onToggleVoice}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${voiceEnabled
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm'
                            : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                        }`}
                >
                    <div className={`w-2 h-2 rounded-full ${voiceEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                    <span>VOICE {voiceEnabled ? 'ON' : 'OFF'}</span>
                </button>
            </div>

            {/* Messages Area - Clean Light Mode */}
            <div className="flex-1 overflow-y-auto px-4 py-8 scrollbar-thin">
                <div className="max-w-3xl mx-auto space-y-6 pb-20">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4">
                            <div className={`w-16 h-16 rounded-2xl ${activeAgent?.color} flex items-center justify-center shadow-lg mx-auto bg-opacity-20`}>
                                <svg style={{ width: '32px', height: '32px' }} className="text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">Hi, I'm your {activeAgent?.label}</h3>
                            <p className="text-sm text-slate-500">Ask me anything!</p>
                        </div>
                    ) : (
                        messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group animate-fade-in`}>
                                <div className={`max-w-[85%] p-5 rounded-2xl shadow-sm transition-all duration-200 border ${msg.role === 'user'
                                        ? 'bg-blue-600 text-white rounded-br-none shadow-blue-200 border-blue-600'
                                        : 'bg-white text-slate-800 rounded-bl-none border-slate-200 shadow-slate-100'
                                    }`}>
                                    {msg.role === 'assistant' ? (
                                        <div className="prose prose-slate prose-sm max-w-none">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>
                                    ) : (
                                        <div className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{msg.content}</div>
                                    )}

                                    {msg.metadata && (
                                        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-2 text-[10px] opacity-70 font-mono">
                                            {msg.metadata.verified && (
                                                <span className="flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 px-1 rounded">
                                                    ✓ VERIFIED
                                                </span>
                                            )}
                                            {msg.metadata.confidence && (
                                                <span>CONF: {msg.metadata.confidence}%</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}

                    {loading && (
                        <div className="flex justify-start pl-2">
                            <div className="flex items-center gap-3 bg-white px-5 py-4 rounded-2xl border border-slate-200 shadow-sm animate-pulse">
                                <div className="w-5 h-5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></div>
                                <span className="text-sm font-bold text-slate-600 tracking-wide">AI IS THINKING...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Area - Light Float */}
            <div className="p-6 bg-transparent sticky bottom-0">
                <div className="max-w-3xl mx-auto relative">

                    {/* STOP RECORDING BUTTON - LARGE & VISIBLE */}
                    {isRecording && (
                        <div className="absolute -top-16 left-1/2 transform -translate-x-1/2">
                            <button
                                onClick={onStopRecording}
                                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-full shadow-lg animate-bounce font-bold text-sm transition-all"
                            >
                                <span className="w-3 h-3 bg-white rounded-sm animate-pulse"></span>
                                STOP RECORDING
                            </button>
                        </div>
                    )}

                    <div className={`bg-white rounded-2xl p-2 border border-slate-200 shadow-xl transition-all duration-300 ${isRecording ? 'ring-4 ring-red-100 border-red-500' : 'focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-300'}`}>
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={isRecording ? "Listening..." : "Message " + activeAgent?.label + "..."}
                            disabled={isRecording || isTranscribing}
                            className="w-full bg-transparent text-slate-800 px-4 py-3 min-h-[52px] max-h-[160px] outline-none resize-none text-sm placeholder:text-slate-400 font-medium"
                            rows={1}
                        />

                        <div className="flex justify-between items-center px-3 pb-1 pt-1">
                            <div className="flex items-center gap-2">
                                {voiceEnabled && !isRecording && (
                                    <button
                                        onClick={onStartRecording}
                                        disabled={isRecording}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-200 uppercase tracking-wide bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700`}
                                    >
                                        MIC
                                    </button>
                                )}

                                <span className="text-[10px] text-slate-400 font-mono ml-2 hidden sm:block">
                                    {isRecording ? 'LISTENING...' : 'ENTER to send'}
                                </span>
                            </div>

                            <button
                                onClick={() => onSend(currentAgent)}
                                disabled={!input.trim() || loading}
                                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ${!input.trim() || loading
                                        ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                        : 'bg-blue-600 text-white shadow-md hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5'
                                    }`}
                            >
                                <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
