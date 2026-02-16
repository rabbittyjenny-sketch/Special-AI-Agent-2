import type { Metadata } from "next";
import "./globals.css";

// Note: Google Fonts may fail in some build environments
// Using CSS fallback instead for reliability

export const metadata: Metadata = {
    title: "Specialized AI Agents",
    description: "AI Orchestrator with MCP Servers",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className="font-sans bg-[#EFF2F9] text-slate-700">
                {children}
            </body>
        </html>
    );
}
