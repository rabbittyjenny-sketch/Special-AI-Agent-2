'use client';
import { agentOptions } from '@/config/agents';

interface SidebarProps {
    currentAgent: string;
    onSelectAgent: (agent: string) => void;
}

export function Sidebar({ currentAgent, onSelectAgent }: SidebarProps) {
    return (
        <div className="h-full flex flex-col bg-slate-50 relative overflow-hidden flex-shrink-0">
            {/* Header - Clean White */}
            <div className="p-6 border-b border-slate-200 bg-white sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/20">
                        i
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-slate-800 tracking-tight">Active Agents</h1>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <p className="text-[10px] text-emerald-600 font-mono font-bold">SYSTEM ONLINE</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Agent List - Light Mode Cards */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
                {agentOptions.map((opt, i) => {
                    const isActive = currentAgent === opt.value;
                    return (
                        <button
                            key={opt.value}
                            onClick={() => onSelectAgent(opt.value)}
                            className={`w-full text-left group relative p-4 rounded-xl transition-all duration-200 border ${isActive
                                    ? `bg-white border-${opt.color.replace('bg-', '')} shadow-md ring-1 ring-slate-200`
                                    : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                                }`}
                        >
                            {/* Active Indicator Bar */}
                            {isActive && (
                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl ${opt.color}`} />
                            )}

                            <div className="flex justify-between items-start mb-2 pl-2">
                                <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${isActive ? `bg-slate-100 text-slate-900 border-slate-200` : 'bg-slate-50 text-slate-500 border-transparent'
                                    }`}>
                                    {opt.value}
                                </div>
                                {isActive && (
                                    <span className={`${opt.textColor} text-[10px] font-mono font-bold`}>ACTIVE</span>
                                )}
                            </div>

                            <div className="space-y-1 pl-2">
                                <h3 className={`font-bold text-sm ${isActive ? 'text-slate-900' : 'text-slate-600 group-hover:text-slate-800'}`}>
                                    {opt.label}
                                </h3>
                                <p className="text-xs text-slate-500 line-clamp-1">
                                    {opt.desc}
                                </p>
                            </div>

                            {/* Status footer inside card */}
                            <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center pl-2">
                                <span className="text-[10px] text-slate-400 font-mono">ID: {opt.value.substring(0, 3).toUpperCase()}-{100 + i}</span>
                                <div className={`w-2 h-2 rounded-full ${isActive ? opt.color : 'bg-slate-300'}`}></div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Footer Area - Light Dashboard Stats */}
            <div className="p-4 border-t border-slate-200 bg-white">
                <div className="flex justify-between text-[10px] text-slate-500 mb-1 font-bold font-mono">
                    <span>CPU LOAD</span>
                    <span>12%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 mb-3">
                    <div className="bg-blue-500 h-1.5 rounded-full w-[12%]"></div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 mb-1 font-bold font-mono">
                    <span>MEMORY</span>
                    <span>45%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div className="bg-red-500 h-1.5 rounded-full w-[45%]"></div>
                </div>
            </div>
        </div>
    );
}
