'use client';

import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { agentOptions } from '@/config/agents';
import { Attachment } from '@/hooks/useChat';
import { AgentMascot } from './AgentMascot';

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
    const [hoveredAgent, setHoveredAgent] = useState<string | null>(null);

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
        <div className="flex flex-col h-full lg:pr-6 gap-6">
            {/* 1. Header (H1) */}
            <motion.header
                className="flex justify-between items-start"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1, duration: 0.5 }}
                >
                    <h1 className="type-h1 text-base md:text-lg text-slate-700">Command Center</h1>
                    <p className="type-button text-[9px] text-slate-400 mt-0.5">iDEAS365 x STRATEGIC AI</p>
                </motion.div>
                <motion.div
                    className="px-3 py-2 rounded-full bg-[#EFF2F9] shadow-soft-inset flex items-center gap-2"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                >
                    <motion.span
                        className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100"
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [1, 0.7, 1]
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                    <span className="type-label text-emerald-600 text-[9px]">ONLINE</span>
                </motion.div>
            </motion.header>

            {/* 2. Agent Grid (Interactive Cards) */}
            <section className="grid grid-cols-2 gap-4 flex-1 max-h-[380px]">
                {agentOptions.map((opt, index) => {
                    const hexColor = getHexColor(opt.color);
                    const isActive = currentAgent === opt.value;
                    const isHovered = hoveredAgent === opt.value;

                    return (
                        <motion.button
                            key={opt.value}
                            onClick={() => onSelectAgent(opt.value)}
                            onHoverStart={() => setHoveredAgent(opt.value)}
                            onHoverEnd={() => setHoveredAgent(null)}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                            whileHover={{ y: -3, scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`cursor-pointer rounded-[22px] p-5 text-left relative overflow-hidden group flex flex-col justify-between h-full min-h-[130px] ${isActive
                                ? 'bg-[#EFF2F9] shadow-soft-inset ring-2 ring-white/50'
                                : 'bg-[#EFF2F9] shadow-soft'
                                }`}
                        >
                            {/* Background gradient overlay */}
                            <motion.div
                                className="absolute inset-0 opacity-0"
                                style={{
                                    background: `linear-gradient(135deg, ${hexColor}10, transparent)`
                                }}
                                animate={{
                                    opacity: isActive ? 0.3 : isHovered ? 0.15 : 0
                                }}
                                transition={{ duration: 0.3 }}
                            />

                            <div className="flex justify-between w-full relative z-10">
                                {/* Mascot Character */}
                                <div className="flex items-center gap-2">
                                    <AgentMascot
                                        agentId={opt.value}
                                        isActive={isActive}
                                        isHovered={isHovered}
                                    />
                                </div>

                                {/* Active Dot Indicator */}
                                <AnimatePresence>
                                    {isActive && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            exit={{ scale: 0 }}
                                            className="w-3.5 h-3.5 rounded-full ring-2 ring-[#EFF2F9]"
                                            style={{ backgroundColor: hexColor }}
                                        />
                                    )}
                                </AnimatePresence>
                            </div>

                            <motion.div
                                className="mt-3 relative z-10"
                                animate={{
                                    x: isActive ? 2 : 0
                                }}
                                transition={{ duration: 0.3 }}
                            >
                                <h3 className={`type-h2 text-sm md:text-base mb-1 transition-colors ${isActive ? 'text-slate-800' : 'text-slate-600'}`}>
                                    {opt.label}
                                </h3>
                                <p className="type-label text-[9px] md:text-[10px] opacity-60">{opt.role}</p>
                            </motion.div>

                            {/* Bottom Border Indicator with Wave Animation */}
                            <motion.div
                                className="absolute bottom-0 left-0 h-2 w-full origin-left"
                                style={{ backgroundColor: hexColor }}
                                initial={{ scaleX: 0 }}
                                animate={{
                                    scaleX: isActive ? 1 : isHovered ? 0.5 : 0
                                }}
                                transition={{
                                    duration: 0.4,
                                    ease: "easeOut"
                                }}
                            />

                            {/* Particle effect for active state */}
                            {isActive && (
                                <motion.div
                                    className="absolute top-4 right-4 w-1 h-1 rounded-full"
                                    style={{ backgroundColor: hexColor }}
                                    animate={{
                                        scale: [1, 2, 1],
                                        opacity: [0.5, 0, 0.5]
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                />
                            )}
                        </motion.button>
                    );
                })}
            </section>

            {/* 3. Input Deck */}
            <motion.section
                className="mt-auto bg-[#EFF2F9] rounded-[22px] shadow-soft p-5 relative z-10 border border-white/40"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.6 }}
            >
                <div className="flex justify-between items-center mb-4">
                    <span className="type-label text-slate-500 text-[9px]">INPUT</span>

                    <div className="flex items-center gap-2">
                        {/* Upload Button */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            multiple
                            accept="image/*,.pdf,.txt,.md" // Adjusted accept for common types
                            onChange={handleFileChange}
                        />
                        <motion.button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading || loading}
                            whileHover={{ scale: isUploading || loading ? 1 : 1.05 }}
                            whileTap={{ scale: isUploading || loading ? 1 : 0.95 }}
                            className={`h-7 px-3 rounded-full flex items-center gap-1.5 transition-all duration-300 ${isUploading
                                ? 'bg-slate-200 text-slate-400 cursor-wait'
                                : 'bg-white text-slate-500 hover:text-slate-700 shadow-sm border border-slate-100'
                                }`}
                        >
                            {/* Clip Icon */}
                            <motion.svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                animate={isUploading ? { rotate: [0, 10, -10, 0] } : {}}
                                transition={{ duration: 0.5, repeat: isUploading ? Infinity : 0 }}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </motion.svg>
                            <span className="type-button text-[9px]">{isUploading ? 'UPLOADING' : 'ATTACH'}</span>
                        </motion.button>

                        <motion.button
                            onClick={onToggleVoice}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`h-7 px-3 rounded-full flex items-center gap-1.5 transition-all duration-300 ${voiceEnabled
                                ? 'bg-emerald-50 text-emerald-600 shadow-sm border border-emerald-100'
                                : 'bg-slate-200/50 text-slate-400'
                                }`}
                        >
                            <motion.span
                                className={`w-1.5 h-1.5 rounded-full transition-colors ${voiceEnabled ? 'bg-emerald-500' : 'bg-slate-400'}`}
                                animate={voiceEnabled ? {
                                    scale: [1, 1.3, 1],
                                    opacity: [1, 0.7, 1]
                                } : {}}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            />
                            <span className="type-button text-[9px]">VOICE</span>
                        </motion.button>
                    </div>
                </div>

                {/* Upload Error Message */}
                {uploadError && (
                    <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-xs text-red-600">{uploadError}</p>
                    </div>
                )}

                {/* Attached Files Preview */}
                <AnimatePresence>
                    {attachments.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex gap-3 mb-4 overflow-x-auto pb-2 scrollbar-thin"
                        >
                            {attachments.map((file, index) => (
                                <motion.div
                                    key={file.id}
                                    initial={{ opacity: 0, x: -20, scale: 0.8 }}
                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                    exit={{ opacity: 0, x: 20, scale: 0.8 }}
                                    transition={{ delay: index * 0.05 }}
                                    whileHover={{ y: -2, scale: 1.02 }}
                                    className="flex-shrink-0 bg-white border border-slate-100 rounded-lg p-2 pr-3 flex items-center gap-3 shadow-sm group relative"
                                >
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
                                    <motion.button
                                        onClick={() => onRemoveAttachment?.(file.id)}
                                        whileHover={{ scale: 1.1, rotate: 90 }}
                                        whileTap={{ scale: 0.9 }}
                                        className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors absolute -top-1.5 -right-1.5 shadow-sm"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </motion.button>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

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
                    className="w-full bg-[#EFF2F9] shadow-soft-inset rounded-inner p-4 min-h-[85px] outline-none type-body text-sm resize-none mb-4 placeholder:text-slate-300 focus:ring-2 focus:ring-slate-100 transition-all font-medium"
                />

                <div className="grid grid-cols-2 gap-4 h-10">
                    <motion.button
                        onClick={isRecording ? onToggleRecording : onToggleRecording}
                        disabled={!voiceEnabled}
                        whileHover={voiceEnabled && !isRecording ? { scale: 1.03, y: -2 } : {}}
                        whileTap={voiceEnabled ? { scale: 0.97 } : {}}
                        className={`rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 relative overflow-hidden group ${isRecording
                            ? 'bg-red-500 text-white shadow-lg ring-4 ring-red-100'
                            : !voiceEnabled
                                ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                : 'bg-[#EFF2F9] text-slate-600 shadow-soft hover:bg-slate-50'
                            }`}
                    >
                        <AnimatePresence mode="wait">
                            {isRecording ? (
                                <motion.div
                                    key="recording"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="flex items-center gap-1.5"
                                >
                                    <motion.span
                                        className="w-2 h-2 bg-white rounded-sm"
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    />
                                    <span className="type-button text-[9px]">STOP</span>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="idle"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="flex items-center gap-1.5"
                                >
                                    <svg className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                                    <span className="type-button text-[9px]">MIC</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.button>

                    <motion.button
                        onClick={onSend}
                        disabled={(!input.trim() && attachments.length === 0) || loading}
                        whileHover={(!input.trim() && attachments.length === 0) || loading ? {} : { scale: 1.03, y: -2 }}
                        whileTap={(!input.trim() && attachments.length === 0) || loading ? {} : { scale: 0.97 }}
                        className={`rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 shadow-lg relative overflow-hidden group ${(!input.trim() && attachments.length === 0) || loading
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                            : 'text-white hover:opacity-90'
                            }`}
                        style={{
                            backgroundColor: ((!input.trim() && attachments.length === 0) || loading) ? undefined : getHexColor(activeAgent?.color || 'bg-[#3b82f6]')
                        }}
                    >
                        {/* Shimmer effect on hover */}
                        {!loading && input.trim() && (
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                initial={{ x: '-100%' }}
                                whileHover={{ x: '100%' }}
                                transition={{ duration: 0.6 }}
                            />
                        )}

                        <AnimatePresence mode="wait">
                            {loading ? (
                                <motion.span
                                    key="loading"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="type-button"
                                >
                                    PROCESSING...
                                </motion.span>
                            ) : (
                                <motion.div
                                    key="execute"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex items-center gap-1.5"
                                >
                                    <span className="type-button text-[9px]">EXECUTE</span>
                                    <motion.svg
                                        className="w-3.5 h-3.5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        whileHover={{ x: 4 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l7 7-7 7M5 12h15" />
                                    </motion.svg>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.button>
                </div>
            </motion.section>
        </div>
    );
}
