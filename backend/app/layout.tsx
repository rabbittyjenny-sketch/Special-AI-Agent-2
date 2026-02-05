import type { Metadata } from "next";
import "./globals.css";

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
            <body className="bg-[#EFF2F9]">{children}</body>
        </html>
    );
}
