import type { Metadata } from "next";
import { Sarabun } from "next/font/google"; // Import Sarabun
import "./globals.css";

// Configure Sarabun Font
const sarabun = Sarabun({
    weight: ['300', '400', '500', '600', '700'],
    subsets: ['thai', 'latin'],
    display: 'swap',
    variable: '--font-sarabun',
});

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
            <body className={`${sarabun.variable} font-sans bg-[#EFF2F9] text-slate-700`}>
                {children}
            </body>
        </html>
    );
}
