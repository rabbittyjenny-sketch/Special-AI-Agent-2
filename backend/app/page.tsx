
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

  // Auto-scroll to bottom when new messages appear
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
          needsReview: result.data.needsReview,
          warnings: result.data.warnings
        } : undefined
      }]);

    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Error: Cannot connect to the brain.',
        metadata: { confidence: 0, verified: false, needsReview: true }
      }]);
    } finally {
      setLoading(false);
    }
  };

  // --- Voice Input Functions ---

  const startRecording = useCallback(async () => {
    if (!voiceEnabled) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm'
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

        if (audioBlob.size < 100) return; // Too short, ignore

        setIsTranscribing(true);

        try {
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');

          const res = await fetch('/api/voice/transcribe', {
            method: 'POST',
            body: formData,
          });

          if (res.ok) {
            const result = await res.json();
            if (result.text?.trim()) {
              setInput(prev => prev ? `${prev} ${result.text}` : result.text);
            }
          } else {
            console.error('Transcription failed:', res.status);
          }
        } catch (err) {
          console.error('Transcription error:', err);
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(250); // Collect data every 250ms
      setIsRecording(true);
    } catch (err) {
      console.error('Microphone access denied:', err);
      setVoiceEnabled(false);
    }
  }, [voiceEnabled]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  // --- Voice Output (TTS) Function ---
  const playTTS = useCallback(async (text: string, messageIndex: number) => {
    // If already playing this message, stop it
    if (playingIndex === messageIndex) {
      audioRef.current?.pause();
      audioRef.current = null;
      setPlayingIndex(null);
      return;
    }

    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setPlayingIndex(null);
    }

    setTtsLoading(messageIndex);

    try {
      const res = await fetch('/api/voice/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error('TTS failed:', err.error || res.status);
        return;
      }

      const audioBlob = await res.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      audio.onended = () => {
        setPlayingIndex(null);
        audioRef.current = null;
        URL.revokeObjectURL(audioUrl);
      };

      audioRef.current = audio;
      setPlayingIndex(messageIndex);
      await audio.play();
    } catch (err) {
      console.error('TTS error:', err);
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
    <div className="max-w-2xl mx-auto p-4 font-sans text-slate-800">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-sky-400 bg-clip-text text-transparent">
          iDEAS365 Agent
        </h1>
        <div className="text-xs text-slate-400">ID: {conversationId.split('-')[0]}</div>
      </div>

      {/* Agent Selector */}
      <div className="flex gap-2 mb-4">
        {agentOptions.map(opt => (
          <button
            key={opt.value}
            onClick={() => setAgentType(opt.value)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
              agentType === opt.value
                ? `${opt.color} text-white shadow-sm`
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Messages Area */}
      <div className="border border-slate-200 bg-white shadow-sm rounded-xl p-6 h-[500px] overflow-y-auto mb-4 flex flex-col gap-4">
        {messages.length === 0 && (
          <div className="text-center text-slate-400 mt-20 italic">
            {voiceEnabled
              ? 'Voice mode ON - กดปุ่มไมค์ค้างไว้แล้วพูด หรือพิมพ์ก็ได้...'
              : 'เริ่มการสนทนาเพื่อทดสอบระบบความจำและสมองกล...'
            }
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${msg.role === 'user'
              ? 'bg-blue-600 text-white rounded-tr-none'
              : 'bg-slate-100 text-slate-700 rounded-tl-none border border-slate-200'
              }`}>
              <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
            </div>

            {/* TTS Play Button for AI messages */}
            {msg.role === 'assistant' && msg.content && (
              <div className="flex items-center gap-1 mt-1 px-1">
                <button
                  onClick={() => playTTS(msg.content, i)}
                  disabled={ttsLoading === i}
                  title={playingIndex === i ? 'Stop playing' : 'Listen to response'}
                  className={`p-1.5 rounded-lg transition-all ${
                    playingIndex === i
                      ? 'bg-blue-500 text-white'
                      : ttsLoading === i
                        ? 'bg-amber-100 text-amber-600'
                        : 'bg-slate-50 text-slate-400 hover:bg-slate-200 hover:text-slate-600'
                  }`}
                >
                  {ttsLoading === i ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                    </svg>
                  ) : playingIndex === i ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                      <rect x="6" y="4" width="4" height="16" rx="1"></rect>
                      <rect x="14" y="4" width="4" height="16" rx="1"></rect>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                    </svg>
                  )}
                </button>
                <span className="text-[10px] text-slate-400">
                  {ttsLoading === i ? 'Loading audio...' : playingIndex === i ? 'Playing...' : ''}
                </span>
              </div>
            )}

            {msg.metadata && (
              <div className="flex gap-2 items-center mt-1 px-1">
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${msg.metadata.confidence > 80 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                  Confidence: {msg.metadata.confidence}%
                </span>

                {msg.metadata.verified && (
                  <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium">
                    Verified
                  </span>
                )}

                {msg.metadata.needsReview && (
                  <span className="text-[10px] text-red-600 bg-red-50 px-2 py-0.5 rounded-full font-medium animate-pulse">
                    Needs Review
                  </span>
                )}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-2 items-center text-slate-400 text-xs animate-pulse">
            <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '75ms' }}></div>
            <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <span>Agent is thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex gap-2 items-center">
        {/* Voice Toggle */}
        <button
          onClick={() => setVoiceEnabled(prev => !prev)}
          title={voiceEnabled ? 'Turn off voice input' : 'Turn on voice input'}
          className={`p-2.5 rounded-xl transition-all shrink-0 ${
            voiceEnabled
              ? 'bg-red-500 text-white shadow-sm hover:bg-red-600'
              : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'
          }`}
        >
          {/* Mic icon */}
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            <line x1="12" x2="12" y1="19" y2="22"></line>
          </svg>
        </button>

        {/* Main Input */}
        <div className="flex-1 flex gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 transition-all">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !loading && sendMessage()}
            placeholder={isTranscribing ? 'Transcribing...' : isRecording ? 'Recording... release to stop' : 'พิมพ์หรือพูดสั่งงานที่นี่...'}
            className="flex-1 px-4 py-2 outline-none text-sm"
            disabled={loading}
          />

          {/* Voice Record Button (only when voice enabled) */}
          {voiceEnabled && (
            <button
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onMouseLeave={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              disabled={loading || isTranscribing}
              title="Hold to record"
              className={`p-2 rounded-xl transition-all ${
                isRecording
                  ? 'bg-red-500 text-white animate-pulse'
                  : isTranscribing
                    ? 'bg-amber-400 text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              } disabled:opacity-30`}
            >
              {isTranscribing ? (
                /* Loading spinner */
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                </svg>
              ) : (
                /* Record circle */
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill={isRecording ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  {isRecording && <circle cx="12" cy="12" r="4" fill="white"></circle>}
                </svg>
              )}
            </button>
          )}

          {/* Send Button */}
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-xl disabled:opacity-30 disabled:hover:bg-blue-600 transition-colors shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </div>
      </div>

      {/* Voice Status Bar */}
      {voiceEnabled && (
        <div className="mt-2 text-center text-[11px] text-slate-400">
          {isRecording
            ? <span className="text-red-500 font-medium">Recording... release to transcribe</span>
            : isTranscribing
              ? <span className="text-amber-500 font-medium">Transcribing with ElevenLabs...</span>
              : <span>Voice mode ON - hold to speak | click speaker icon to hear AI response</span>
          }
        </div>
      )}

      {/* Info Cards */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-[11px] text-blue-700">
          <strong>Smart Lazy Logic:</strong> AI learns your preferences and stores them in memory for future interactions.
        </div>
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600">
          <strong>Self-Verification:</strong> Every response is verified against quality rules before reaching you.
        </div>
      </div>
    </div>
  );
}
