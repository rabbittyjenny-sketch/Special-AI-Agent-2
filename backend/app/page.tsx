
'use client';

import { useState, useEffect } from 'react';

/**
 * iDEAS365 Agent Test Interface
 * เน้นความสะอาดตาและการแสดงสถานะ Verification ชัดเจน
 */
export default function Home() {
  const [conversationId, setConversationId] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // 🔥 Fix Hydration: สร้าง ID เฉพาะฝั่ง Client เท่านั้น
  useEffect(() => {
    setConversationId(crypto.randomUUID());
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setLoading(true);

    // Add user message to UI
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          userId: 'test-user-123',
          agentType: 'coder',
          message: userMessage
        })
      });

      const result = await res.json();

      // Add assistant message to UI
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: result.data.message,
        metadata: {
          confidence: result.data.confidence,
          verified: result.data.verified,
          needsReview: result.data.needsReview,
          warnings: result.data.warnings
        }
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

  return (
    <div className="max-w-2xl mx-auto p-4 font-sans text-slate-800">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-sky-400 bg-clip-text text-transparent">
          iDEAS365 Agent Test
        </h1>
        <div className="text-xs text-slate-400">ID: {conversationId.split('-')[0]}</div>
      </div>

      <div className="border border-slate-200 bg-white shadow-sm rounded-xl p-6 h-[500px] overflow-y-auto mb-6 flex flex-col gap-4">
        {messages.length === 0 && (
          <div className="text-center text-slate-400 mt-20 italic">
            เริ่มการสนทนาเพื่อทดสอบระบบความจำและสมองกล...
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

            {msg.metadata && (
              <div className="flex gap-2 items-center mt-2 px-1">
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${msg.metadata.confidence > 80 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                  Confidence: {msg.metadata.confidence}%
                </span>

                {msg.metadata.verified && (
                  <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium">
                    ✓ Verified
                  </span>
                )}

                {msg.metadata.needsReview && (
                  <span className="text-[10px] text-red-600 bg-red-50 px-2 py-0.5 rounded-full font-medium animate-pulse">
                    ⚠️ Needs Review
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-2 items-center text-slate-400 text-xs animate-pulse">
            <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce delay-75"></div>
            <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce delay-150"></div>
            <span>Agent is thinking...</span>
          </div>
        )}
      </div>

      <div className="flex gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 transition-all">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="พิมพ์ข้อความสั่งงานที่นี่..."
          className="flex-1 px-4 py-2 outline-none text-sm"
          disabled={loading}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-xl disabled:opacity-30 disabled:hover:bg-blue-600 transition-colors shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </button>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4">
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-[11px] text-blue-700">
          <strong>Smart Lazy Logic:</strong> AI บันทึกความชอบของคุณลงใน <code className="bg-white px-1 rounded">MEMORY.md</code> อัตโนมัติทุกครั้งที่ได้รับ Feedback
        </div>
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600">
          <strong>Self-Verification:</strong> ทุกคำตอบผ่านการตรวจสอบกับกฎ <code className="bg-white px-1 rounded">CHECKLIST.md</code> ก่อนส่งถึงมือคุณ
        </div>
      </div>
    </div>
  );
}
