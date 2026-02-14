'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CommandCenter } from '@/app/components/CommandCenter';
import { DisplayPanel } from '@/app/components/DisplayPanel';
import { useChat } from '@/hooks/useChat';
import { useVoiceHook } from '@/hooks/useVoice';

export default function Home() {
  const [agentType, setAgentType] = useState('coder');

  // Custom Hooks
  const chat = useChat();
  const voice = useVoiceHook();

  // Sync Voice Input to Chat Input (Only when voice changes)
  useEffect(() => {
    if (voice.input) {
      chat.setInput(prev => {
        if (prev.includes(voice.input)) return prev;
        return prev ? `${prev} ${voice.input}`.trim() : voice.input;
      });
    }
  }, [voice.input]);

  // Handle Send & Clear Voice
  const handleSend = async () => {
    await chat.sendMessage(agentType);
    voice.setInput('');
    // Clear Chat Input handled by useChat internal
  };

  return (
    // UNIVERSE CROWN EDITION - 2 COLUMN SYMMETRIC LAYOUT (FIXED LEFT, SCROLLABLE RIGHT)
    <main className="min-h-screen w-full bg-[#EFF2F9] p-4 md:p-6 lg:p-8 font-sans overflow-x-hidden">

      <motion.div
        className="max-w-[1800px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-5 lg:gap-8 items-start"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >

        {/* LEFT COLUMN: COMMAND CENTER (STICKY) - 5/12 Grid */}
        <motion.section
          className="lg:col-span-5 hidden lg:block sticky top-6 h-[calc(100vh-3rem)]"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
        >
          <CommandCenter
            currentAgent={agentType}
            onSelectAgent={setAgentType}
            input={chat.input}
            setInput={chat.setInput}
            onSend={handleSend}
            isRecording={voice.isRecording}
            onToggleRecording={voice.isRecording ? voice.stopRecording : voice.startRecording}
            voiceEnabled={voice.voiceEnabled}
            onToggleVoice={voice.toggleVoice}
            loading={chat.loading}
            // Upload Props
            attachments={chat.attachments}
            onUpload={chat.handleUpload}
            isUploading={chat.isUploading}
            uploadError={chat.uploadError}
            onRemoveAttachment={chat.removeAttachment}
          />
        </motion.section>

        {/* MOBILE VIEW FOR LEFT COLUMN (Not Sticky on Mobile) */}
        <motion.section
          className="lg:hidden col-span-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
        >
          <CommandCenter
            currentAgent={agentType}
            onSelectAgent={setAgentType}
            input={chat.input}
            setInput={chat.setInput}
            onSend={handleSend}
            isRecording={voice.isRecording}
            onToggleRecording={voice.isRecording ? voice.stopRecording : voice.startRecording}
            voiceEnabled={voice.voiceEnabled}
            onToggleVoice={voice.toggleVoice}
            loading={chat.loading}
            // Upload Props
            attachments={chat.attachments}
            onUpload={chat.handleUpload}
            isUploading={chat.isUploading}
            uploadError={chat.uploadError}
            onRemoveAttachment={chat.removeAttachment}
          />
        </motion.section>

        {/* RIGHT COLUMN: DISPLAY PANEL (SCROLLABLE) - 7/12 Grid */}
        <motion.section
          className="lg:col-span-7 h-[70vh] md:h-[80vh] lg:h-[calc(100vh-3rem)]"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <DisplayPanel
            currentAgent={agentType}
            messages={chat.messages}
            loading={chat.loading}
            // @ts-ignore
            messagesEndRef={chat.messagesEndRef}
          />
        </motion.section>

      </motion.div>

      {/* FOOTER COPYRIGHT */}
      <motion.footer
        className="max-w-[1800px] mx-auto mt-6 md:mt-8 pb-4 text-center px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        <p className="text-slate-500 text-xs md:text-sm leading-relaxed">
          2025 All Rights Reserved. | Curated by <span className="font-semibold text-slate-600">iDEAS365</span> x <span className="font-semibold text-slate-600">Generative AI</span>
        </p>
      </motion.footer>
    </main>
  );
}