'use client';

import { useState, useEffect } from 'react';
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
    <main className="min-h-screen w-full bg-[#EFF2F9] p-4 md:p-8 lg:p-12 font-sans overflow-x-hidden">

      <div className="max-w-[1920px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 lg:gap-12 items-start">

        {/* LEFT COLUMN: COMMAND CENTER (STICKY) - 5/12 Grid */}
        <section className="lg:col-span-5 hidden lg:block sticky top-8 h-[calc(100vh-4rem)]">
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
        </section>

        {/* MOBILE VIEW FOR LEFT COLUMN (Not Sticky on Mobile) */}
        <section className="lg:hidden col-span-1">
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
        </section>

        {/* RIGHT COLUMN: DISPLAY PANEL (SCROLLABLE) - 7/12 Grid */}
        <section className="lg:col-span-7 h-[70vh] md:h-[80vh] lg:h-[calc(100vh-4rem)]">
          <DisplayPanel
            currentAgent={agentType}
            messages={chat.messages}
            loading={chat.loading}
            // @ts-ignore
            messagesEndRef={chat.messagesEndRef}
          />
        </section>

      </div>

      {/* FOOTER COPYRIGHT */}
      <footer className="max-w-[1920px] mx-auto mt-8 md:mt-12 pb-6 text-center">
        <p className="text-slate-500 text-sm md:text-base">
          2025 All Rights Reserved. | Curated by <span className="font-semibold text-slate-600">iDEAS365</span> x <span className="font-semibold text-slate-600">Generative AI</span>
        </p>
      </footer>
    </main>
  );
}