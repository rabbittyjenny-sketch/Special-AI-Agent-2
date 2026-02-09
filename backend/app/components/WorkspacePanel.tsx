'use client';

export function WorkspacePanel() {
    return (
        <div className="h-full flex flex-col bg-slate-50 border-l border-slate-200 relative flex-shrink-0">
            {/* Header - Clean White */}
            <div className="p-6 border-b border-slate-200 bg-white sticky top-0 z-10">
                <div className="flex justify-between items-center">
                    <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Workspace</h2>
                    <div className="flex gap-2">
                        <button className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors">
                            <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Empty State / Content Area */}
            <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
                {/* Fixed Size Container for Icon */}
                <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center mb-4 flex-shrink-0">
                    <svg style={{ width: '32px', height: '32px' }} className="text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <h3 className="text-sm font-bold text-slate-700 mb-1">No Files Generated</h3>
                <p className="text-xs text-slate-400 px-4">
                    Outputs from agents will appear here for review.
                </p>
            </div>

            {/* System Status Footer */}
            <div className="p-4 border-t border-slate-200 bg-white space-y-3 mt-auto">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 shadow-sm">
                    <div>
                        <div className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-0.5">SMART LEARNING</div>
                        <div className="text-[10px] text-slate-500 font-mono">ACTIVE - PATTERN REC.</div>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 shadow-sm">
                    <div>
                        <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-0.5">QUALITY CHECK</div>
                        <div className="text-[10px] text-slate-500 font-mono">VERIFICATION ON</div>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                </div>
            </div>
        </div>
    );
}
