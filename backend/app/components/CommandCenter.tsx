'use client';

import { useRef } from 'react';
import { agentOptions } from '@/config/agents';
import { Attachment } from '@/hooks/useChat';

interface CommandCenterProps {
    currentAgent: string;
    onSelectAgent: (agent: string) => void;
    input: string;
    setInput: (val: string) => void;
    onSend: () => void;
    isRecording: boolean;
    onToggleRecording: () => void;
    voiceEnabled: boolean;
    onToggleVoice: () => void;
    loading: boolean;
    // Upload Props
    attachments?: Attachment[];
    onUpload?: (files: File[]) => void;
    isUploading?: boolean;
    uploadError?: string;
    onRemoveAttachment?: (id: string) => void;
}

export function CommandCenter({
    currentAgent,
    onSelectAgent,
    input,
    setInput,
    onSend,
    isRecording,
    onToggleRecording,
    voiceEnabled,
    onToggleVoice,
    loading,
    attachments = [],
    onUpload,
    isUploading,
    uploadError,
    onRemoveAttachment
}: CommandCenterProps) {

    const activeAgent = agentOptions.find(a => a.value === currentAgent);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Helper to extract clean hex color from Tailwind arbitrary class "bg-[#...]"
    const getHexColor = (bgClass: string) => {
        return bgClass.replace('bg-[', '').replace(']', '');
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0 && onUpload) {
            onUpload(Array.from(e.target.files));
        }
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="flex flex-col h-full lg:pr-8 gap-8">
            {/* 1. Header (H1) */}
            <header className="flex justify-between items-start">
                <div>
                    <h1 className="type-h1 text-slate-700">Command Center</h1>
                    <p className="type-button text-slate-400 mt-2">iDEAS365 x STRATEGIC AI</p>
                </div>
                <div className="px-5 py-3 rounded-full bg-[#EFF2F9] shadow-soft-inset flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse ring-2 ring-emerald-100"></span>
                    <span className="type-label text-emerald-600">SYSTEM ONLINE</span>
                </div>
            </header>

            {/* 2. Agent Grid (Interactive Cards) */}
            <section className="grid grid-cols-2 gap-6 flex-1 max-h-[400px]">
                {agentOptions.map((opt) => {
                    const hexColor = getHexColor(opt.color);
                    const isActive = currentAgent === opt.value;

                    return (
                        <button
                            key={opt.value}
                            onClick={() => onSelectAgent(opt.value)}
                            className={`cursor-pointer rounded-master p-6 text-left relative overflow-hidden transition-all duration-300 group flex flex-col justify-between h-full min-h-[160px] ${isActive
                                ? 'bg-[#EFF2F9] shadow-soft-inset ring-2 ring-white/50 transform scale-[0.98]'
                                : 'bg-[#EFF2F9] shadow-soft hover:-translate-y-1 hover:shadow-soft-sm'
                                }`}
                        >
                            <div className="flex justify-between w-full">
                                {/* Icon Box with Inline Color */}
                                <div
                                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-md transition-colors"
                                    style={{ backgroundColor: hexColor }}
                                >
                                    {opt.label[0]}
                                </div>

                                {/* Active Dot Indicator */}
                                {isActive && (
                                    <div
                                        className="w-3 h-3 rounded-full ring-2 ring-[#EFF2F9]"
                                        style={{ backgroundColor: hexColor }}
                                    ></div>
                                )}
                            </div>

                            <div className="mt-4">
                                <h3 className={`type-h2 text-lg mb-1 transition-colors ${isActive ? 'text-slate-800' : 'text-slate-600'}`}>
                                    {opt.label}
                                </h3>
                                <p className="type-label text-[10px] opacity-70">{opt.role}</p>
                            </div>

                            {/* Bottom Border Indicator (Inline Color) */}
                            <div
                                className={`absolute bottom-0 left-0 h-1.5 w-full transform origin-left transition-transform duration-300 ${isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-50'}`}
                                style={{ backgroundColor: hexColor }}
                            ></div>
                        </button>
                    );
                })}
            </section>

            {/* 3. Input Deck */}
            <section className="mt-auto bg-[#EFF2F9] rounded-master shadow-soft p-8 relative z-10 border border-white/40">
                <div className="flex justify-between items-center mb-6">
                    <span className="type-label text-slate-500">INPUT COMMAND</span>

                    <div className="flex items-center gap-3">
                        {/* Upload Button */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            multiple
                            accept="image/*,.pdf,.txt,.md" // Adjusted accept for common types
                            onChange={handleFileChange}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading || loading}
                            className={`h-8 px-4 rounded-full flex items-center gap-2 transition-all duration-300 ${isUploading
                                ? 'bg-slate-200 text-slate-400 cursor-wait'
                                : 'bg-white text-slate-500 hover:text-slate-700 shadow-sm border border-slate-100'
                                }`}
                        >
                            {/* Clip Icon */}
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                            <span className="type-button text-[10px]">{isUploading ? 'UPLOADING...' : 'ATTACH'}</span>
                        </button>

                        <button
                            onClick={onToggleVoice}
                            className={`h-8 px-4 rounded-full flex items-center gap-2 transition-all duration-300 ${voiceEnabled
                                ? 'bg-emerald-50 text-emerald-600 shadow-sm border border-emerald-100'
                                : 'bg-slate-200/50 text-slate-400'
                                }`}
                        >
                            <span className={`w-2 h-2 rounded-full transition-colors ${voiceEnabled ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                            <span className="type-button text-[10px]">VOICE MODE</span>
                        </button>
                    </div>
                </div>

                {/* Upload Error Message */}
                {uploadError && (
                    <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-xs text-red-600">{uploadError}</p>
                    </div>
                )}

                {/* Attached Files Preview */}
                {attachments.length > 0 && (
                    <div className="flex gap-3 mb-4 overflow-x-auto pb-2 scrollbar-thin">
                        {attachments.map((file) => (
                            <div key={file.id} className="flex-shrink-0 bg-white border border-slate-100 rounded-lg p-2 pr-3 flex items-center gap-3 shadow-sm group relative">
                                {/* Thumbnail / Icon */}
                                <div className="w-10 h-10 bg-slate-50 rounded-md flex items-center justify-center overflow-hidden">
                                    {file.mimeType.startsWith('image/') && file.metadata?.base64 ? (
                                        <img src={`data:${file.mimeType};base64,${file.metadata.base64}`} alt={file.filename} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">{file.filename.split('.').pop()}</span>
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-medium text-slate-600 max-w-[100px] truncate" title={file.filename}>{file.filename}</span>
                                    <span className="text-[8px] text-slate-400">{(file.size / 1024).toFixed(1)} KB</span>
                                </div>
                                {/* Remove Button */}
                                <button
                                    onClick={() => onRemoveAttachment?.(file.id)}
                                    className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors absolute -top-1.5 -right-1.5 shadow-sm"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (!loading && (input.trim() || attachments.length > 0)) onSend();
                        }
                    }}
                    placeholder={`Instruct ${activeAgent?.label}...`}
                    className="w-full bg-[#EFF2F9] shadow-soft-inset rounded-inner p-6 min-h-[140px] outline-none type-body text-lg resize-none mb-6 placeholder:text-slate-300 focus:ring-2 focus:ring-slate-100 transition-all font-medium"
                />

                <div className="grid grid-cols-2 gap-6 h-14">
                    <button
                        onClick={isRecording ? onToggleRecording : onToggleRecording}
                        disabled={!voiceEnabled}
                        className={`rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 relative overflow-hidden group ${isRecording
                            ? 'bg-red-500 text-white shadow-lg animate-pulse ring-4 ring-red-100'
                            : !voiceEnabled
                                ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                : 'bg-[#EFF2F9] text-slate-600 shadow-soft hover:bg-slate-50 active:shadow-soft-inset active:translate-y-0.5'
                            }`}
                    >
                        {isRecording ? (
                            <>
                                <span className="w-3 h-3 bg-white rounded-sm animate-spin"></span>
                                <span className="type-button">STOP</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5 opacity-60 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                                <span className="type-button">MIC START</span>
                            </>
                        )}
                    </button>

                    <button
                        onClick={onSend}
                        disabled={(!input.trim() && attachments.length === 0) || loading}
                        className={`rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 shadow-lg relative overflow-hidden group ${(!input.trim() && attachments.length === 0) || loading
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                            : 'text-white hover:opacity-90 hover:-translate-y-1 active:translate-y-0'
                            }`}
                        // Use Inline Style for active Agent Color
                        style={{
                            backgroundColor: ((!input.trim() && attachments.length === 0) || loading) ? undefined : getHexColor(activeAgent?.color || 'bg-[#3b82f6]')
                        }}
                    >
                        {loading ? (
                            <span className="type-button animate-pulse">PROCESSING...</span>
                        ) : (
                            <>
                                <span className="type-button">EXECUTE</span>
                                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l7 7-7 7M5 12h15" /></svg>
                            </>
                        )}
                    </button>
                </div>
            </section>
        </div>
    );
}
