"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
    Send,
    Bot,
    User,
    BarChart3,
    LayoutDashboard,
    Settings,
    MessageSquare,
    Sparkles,
    ChevronRight,
    Database,
    Search
} from 'lucide-react';

// --- UI Components with Embedded Styles (Fixing the "Dead UI" issue) ---

const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <div className={`p-8 rounded-[28px] border border-white/60 bg-[#EFF2F9] shadow-[15px_15px_30px_#d1d9e6,-15px_-15px_30px_#ffffff] ${className}`}>
        {children}
    </div>
);

const MessageBubble = ({ role, content, agentType }: { role: string, content: string, agentType?: string }) => (
    <div style={{ display: 'flex', width: '100%', marginBottom: '2rem', justifyContent: role === 'user' ? 'flex-end' : 'flex-start' }}>
        <div style={{ display: 'flex', maxWidth: '80%', gap: '1rem', flexDirection: role === 'user' ? 'row-reverse' : 'row' }}>
            <div className="neo-button" style={{ width: '48px', height: '48px', flexShrink: 0, color: role === 'assistant' ? '#3b82f6' : '#64748b' }}>
                {role === 'assistant' ? <Bot size={24} /> : <User size={24} />}
            </div>
            <div style={{
                padding: '1.5rem',
                borderRadius: '24px',
                backgroundColor: role === 'user' ? '#334155' : '#EFF2F9',
                color: role === 'user' ? 'white' : '#475569',
                boxShadow: role === 'user' ? '0 10px 15px -3px rgba(0,0,0,0.1)' : '15px 15px 30px #d1d9e6, -15px -15px 30px #ffffff'
            }}>
                {agentType && role === 'assistant' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', opacity: 0.6 }}>
                        <Sparkles size={12} />
                        <span style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{agentType} Agent</span>
                    </div>
                )}
                <p style={{ fontSize: '16px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{content}</p>
            </div>
        </div>
    </div>
);

// --- MAIN APP ---

export default function ChatPage() {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<any[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [activeAgent, setActiveAgent] = useState('analyst');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: input,
                    conversationId: 'default-uuid-session'
                }),
            });

            const data = await response.json();
            if (data.message) {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: data.message,
                    agentType: data.agentType || 'system'
                }]);
            }
        } catch (error) {
            console.error('Chat error:', error);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div style={{ display: 'flex', height: '100vh', backgroundColor: '#EFF2F9', color: '#475569' }}>

            {/* SIDEBAR */}
            <aside style={{ width: '320px', padding: '2rem', display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.4)' }}>
                <header style={{ marginBottom: '3rem' }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', letterSpacing: '0.1em', color: '#334155', textTransform: 'uppercase' }}>AI AGENTS</h1>
                    <p style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'bold', letterSpacing: '0.4em', textTransform: 'uppercase' }}>Specialized Orchestrator</p>
                </header>

                <nav style={{ flex: 1 }}>
                    <SidebarItem icon={LayoutDashboard} label="Dashboard" />
                    <SidebarItem icon={MessageSquare} label="All Chats" active={true} />
                    <div style={{ margin: '2.5rem 0', height: '1px', backgroundColor: 'rgba(51,65,85,0.1)' }}></div>
                    <p style={{ padding: '0 1.5rem', marginBottom: '1.5rem', fontSize: '10px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.3em' }}>Specialized Agents</p>
                    <SidebarItem icon={BarChart3} label="Analyst Agent" active={activeAgent === 'analyst'} onClick={() => setActiveAgent('analyst')} />
                    <SidebarItem icon={Database} label="System Core" />
                </nav>
            </aside>

            {/* CHAT AREA */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
                <header style={{ height: '6rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 3rem', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div className="neo-button" style={{ width: '40px', height: '40px', color: '#3b82f6' }}><Bot size={20} /></div>
                        <div>
                            <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Active Orchestrator</h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '50%' }}></span>
                                <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>System Online</span>
                            </div>
                        </div>
                    </div>
                </header>

                <section style={{ flex: 1, overflowY: 'auto', padding: '3rem' }}>
                    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                        {messages.length === 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: '5rem 0', opacity: 0.4 }}>
                                <div className="neo-button" style={{ width: '64px', height: '64px', color: '#cbd5e1', marginBottom: '1.5rem' }}><Sparkles size={32} /></div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8' }}>Start a strategic conversation</h3>
                                <p style={{ maxWidth: '400px', fontSize: '14px', marginTop: '0.5rem' }}>ระบบ Specialized AI พร้อมทำงานร่วมกับคุณเพื่อวิเคราะห์ข้อมูลและสร้างกลยุทธ์ตามแนวทางที่ต้องการ</p>
                            </div>
                        )}

                        {messages.map((msg, idx) => (
                            <MessageBubble key={idx} {...msg} />
                        ))}

                        {isTyping && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#94a3b8', marginLeft: '4rem' }}>
                                <span style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Agent is processing...</span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </section>

                <footer style={{ padding: '3rem' }}>
                    <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative' }}>
                        <div className="neo-card" style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Type your strategic query here..."
                                style={{ flex: 1, backgroundColor: 'transparent', padding: '1rem 1.5rem', fontSize: '16px', fontWeight: 500, border: 'none', outline: 'none' }}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim()}
                                style={{
                                    width: '56px', height: '56px', borderRadius: '22px', border: 'none',
                                    backgroundColor: input.trim() ? '#334155' : '#EFF2F9',
                                    color: input.trim() ? 'white' : '#cbd5e1',
                                    boxShadow: input.trim() ? '0 10px 15px -3px rgba(0,0,0,0.1)' : '5px 5px 10px #d1d9e6, -5px -5px 10px #ffffff',
                                    cursor: 'pointer'
                                }}
                            >
                                <Send size={24} />
                            </button>
                        </div>
                        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '10px', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.4em' }}>
                            iDEAS365 x STRATEGIC AI ORCHESTRATOR
                        </p>
                    </div>
                </footer>
            </main>

            <style jsx global>{`
        .neo-button {
          background-color: #EFF2F9;
          border-radius: 22px;
          box-shadow: 5px 5px 10px #d1d9e6, -5px -5px 10px #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
        }
        .neo-card {
           background-color: #EFF2F9;
           box-shadow: 15px 15px 30px #d1d9e6, -15px -15px 30px #ffffff;
           border: 1px solid rgba(255,255,255,0.6);
           border-radius: 28px;
        }
      `}</style>
        </div>
    );
}

const SidebarItem = ({ icon: Icon, label, active = false, onClick }: any) => (
    <button
        onClick={onClick}
        style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem', borderRadius: '20px',
            backgroundColor: active ? '#f1f5f9' : 'transparent',
            boxShadow: active ? 'inset 5px 5px 10px #d1d9e6, inset -5px -5px 10px #ffffff' : 'none',
            border: 'none', color: active ? '#334155' : '#94a3b8', cursor: 'pointer', marginBottom: '1rem'
        }}
    >
        <Icon size={20} style={{ color: active ? '#3b82f6' : 'inherit' }} />
        <span style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</span>
    </button>
);
