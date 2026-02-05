import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as ss from 'simple-statistics';
import dotenv from 'dotenv';

dotenv.config();

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwpMneM-NRaZdnCPrMZPZ0bVup-XJUTZjou9jFL4aPJ5RBk3BT5LS4vW6neluagn0osSQ/exec";

const server = new Server(
    {
        name: "analyst-agent",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "fetch_google_sheet_data",
                description: "ดึงข้อมูลจากตาราง Google Sheets ผ่าน Apps Script Web App",
                inputSchema: {
                    type: "object",
                    properties: {
                        sheet: { type: "string", description: "ชื่อหน้าตาราง (เช่น Sales, Inventory, Expenses)" },
                    },
                    required: ["sheet"],
                },
            },
            {
                name: "analyze_numbers",
                description: "คำนวณสรุปสถิติจากชุดตัวเลขที่ดึงมา",
                inputSchema: {
                    type: "object",
                    properties: {
                        data: { type: "array", items: { type: "number" } },
                        method: { type: "string", enum: ["mean", "median", "stddev", "min", "max"] },
                    },
                    required: ["data", "method"],
                },
            },
        ],
    };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        if (name === "fetch_google_sheet_data") {
            const { sheet } = args as { sheet: string };
            const response = await fetch(`${GOOGLE_SCRIPT_URL}?sheet=${sheet}`);
            const data = await response.json();

            return {
                content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
            };
        }

        if (name === "analyze_numbers") {
            const { data, method } = args as { data: number[]; method: string };
            let result: number;
            switch (method) {
                case "mean": result = ss.mean(data); break;
                case "max": result = ss.max(data); break;
                case "min": result = ss.min(data); break;
                case "stddev": result = ss.standardDeviation(data); break;
                default: result = 0;
            }
            return {
                content: [{ type: "text", text: `ผลลัพธ์การวิเคราะห์ (${method}): ${result.toFixed(2)}` }],
            };
        }

        throw new Error(`Tool not found: ${name}`);
    } catch (error: any) {
        return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
        };
    }
});

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Analyst Agent (Apps Script Edition) is running!");
}

main().catch(console.error);
