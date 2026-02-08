'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export default function Home() {
  const [conversationId, setConversationId] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [agentType, setAgentType] = useState<string>('coder');

  // Voice input state
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Voice output (TTS) state
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [ttsLoading, setTtsLoading] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setConversationId(crypto.randomUUID());
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = input;
    setInput('');
    setLoading(true);
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
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Error: Cannot connect to the brain.',
        metadata: { confidence: 0, verified: false }
      }]);
    } finally {
      setLoading(false);
    }
  };

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

  const playTTS = useCallback(async (text: string, index: number) => {
    if (playingIndex === index) {
      audioRef.current?.pause();
      setPlayingIndex(null);
      return;
    }
    setTtsLoading(index);
    try {
      const res = await fetch('/api/voice/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const audioBlob = await res.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.onended = () => { setPlayingIndex(null); URL.revokeObjectURL(audioUrl); };
      audioRef.current = audio;
      setPlayingIndex(index);
      await audio.play();
    } finally {
      setTtsLoading(null);
    }
  }, [playingIndex]);

  const agentOptions = [
    { value: 'coder', label: 'Coder', color: 'bg-emerald-500' },
    { value: 'design', label: 'Design', color: 'bg-purple-500' },
    { value: 'analyst', label: 'Analyst', color: 'bg-amber-500' },
    { value: 'marketing', label: 'Marketing', color: 'bg-pink-500' },
  ];

  return (
    <div className="min-h-screen py-8 px-4 flex flex-col items-center selection:bg-blue-500/30">
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] -z-10 animate-pulse"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px] -z-10 animate-pulse" style={{ animationDelay: '1s' }}></div>

      <div className="w-full max-w-3xl glass-container shadow-2xl p-6 md:p-8 flex flex-col gap-6 animate-fade-in relative overflow-hidden">
        <div className="flex justify-between items-center relative z-10">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-sky-300 to-purple-400 bg-clip-text text-transparent leading-tight">iDEAS365 Agent</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 font-medium">Smart Specialist Agent System</p>
          </div>
          <div className="text-[10px] font-mono text-slate-400 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 shadow-inner">ID: {conversationId.split('-')[0]}</div>
        </div>

        <div className="flex flex-wrap gap-2 relative z-10">
          {agentOptions.map(opt => (
            <button key={opt.value} onClick={() => setAgentType(opt.value)} className={`text-[11px] px-4 py-2 rounded-xl font-medium transition-all duration-300 border ${agentType === opt.value ? 'bg-white/10 border-white/25 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)] scale-105' : 'bg-transparent border-white/5 text-slate-500 hover:text-slate-300 hover:border-white/15'}`}>
              <span className={`inline-block w-1.5 h-1.5 rounded-full mr-2 ${opt.color.replace('bg-', 'bg-opacity-80 bg-')}`}></span>
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex-1 bg-black/20 rounded-2xl p-4 md:p-6 h-[500px] overflow-y-auto mb-2 flex flex-col gap-6 border border-white/5 relative z-10 scroll-smooth">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 italic gap-4 opacity-50">
              <div className="w-14 h-14 rounded-2xl border border-dashed border-slate-700 flex items-center justify-center bg-white/5">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              </div>
              <p className="text-xs">เริ่มการสนทนาเพื่อทดสอบระบบความจำและสมองกล...</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-fade-in`}>
              <div className={`max-w-[88%] p-4 rounded-2xl transition-all ${msg.role === 'user' ? 'bg-blue-600/90 text-white rounded-tr-none shadow-xl glow-blue' : 'bg-white/5 text-slate-200 rounded-tl-none border border-white/10'}`}>
                <div className="whitespace-pre-wrap text-[13px] leading-relaxed">{msg.content}</div>
              </div>
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-3 mt-2 px-1">
                  <button onClick={() => playTTS(msg.content, i)} className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:bg-white/10">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                  </button>
                  {msg.metadata && <span className="text-[8px] uppercase tracking-widest font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">{msg.metadata.confidence}% Confidence</span>}
                </div>
              )}
            </div>
          ))}
          {loading && <div className="text-slate-600 text-[11px] animate-pulse uppercase tracking-widest">Agent is thinking...</div>}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex gap-3 items-center relative z-10">
          <button onClick={() => setVoiceEnabled(!voiceEnabled)} className={`p-3.5 rounded-2xl border ${voiceEnabled ? 'bg-red-500/20 border-red-500/40 text-red-400' : 'bg-white/5 border-white/10 text-slate-500'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" x2="12" y1="19" y2="22"></line></svg>
          </button>
          <div className="flex-1 flex gap-2 bg-white/5 p-2 rounded-2xl border border-white/10 focus-within:ring-1 focus-within:ring-blue-500/20">
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} placeholder={isRecording ? 'Listening...' : 'พิมพ์หรือพูดสั่งงานที่นี่...'} className="flex-1 bg-transparent px-4 py-2 outline-none text-white text-sm placeholder:text-slate-700" />
            {voiceEnabled && (
              <button onClick={() => isRecording ? stopRecording() : startRecording()} className={`p-2.5 rounded-xl ${isRecording ? 'bg-red-500' : 'bg-white/10'} text-white`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><rect x="9" y="9" width="6" height="6" fill="white" className={isRecording ? 'block' : 'hidden'}></rect></svg>
              </button>
            )}
            <button onClick={sendMessage} className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-xl shadow-lg shadow-blue-600/20"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg></button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-2 relative z-10 text-[10px] text-slate-500">
          <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl"><span className="text-blue-400 font-bold block mb-1">SMART LAZY LOGIC</span>AI learns your preferences and stores patterns.</div>
          <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl"><span className="text-purple-400 font-bold block mb-1">SELF-VERIFICATION</span>Autonomous quality checks for every response.</div>
        </div>
      </div>
    </div>
  );
}