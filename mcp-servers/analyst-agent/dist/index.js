import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { google } from 'googleapis';
import * as ss from 'simple-statistics';
import dotenv from 'dotenv';
dotenv.config();
const server = new Server({
    name: "analyst-agent",
    version: "1.0.0",
}, {
    capabilities: {
        tools: {},
    },
});
/**
 * Tool: Query Google Sheets
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "query_google_sheets",
                description: "Fetch data from a Google Sheet",
                inputSchema: {
                    type: "object",
                    properties: {
                        sheetId: { type: "string" },
                        range: { type: "string" },
                    },
                    required: ["sheetId", "range"],
                },
            },
            {
                name: "statistical_analysis",
                description: "Perform statistical analysis on numerical data",
                inputSchema: {
                    type: "object",
                    properties: {
                        data: { type: "array", items: { type: "number" } },
                        method: {
                            type: "string",
                            enum: ["mean", "median", "stddev", "min", "max"]
                        },
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
        if (name === "query_google_sheets") {
            const { sheetId, range } = args;
            // Note: In a real scenario, we'd use service account credentials from process.env
            // For now, we'll return a helpful message or mock data if credentials aren't set
            if (!process.env.GOOGLE_SHEETS_CREDENTIALS) {
                return {
                    content: [{ type: "text", text: "Error: Google Sheets credentials are not configured. Please provide GOOGLE_SHEETS_CREDENTIALS in .env" }],
                    isError: true
                };
            }
            const auth = new google.auth.GoogleAuth({
                credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS),
                scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
            });
            const sheets = google.sheets({ version: 'v4', auth });
            const response = await sheets.spreadsheets.values.get({
                spreadsheetId: sheetId,
                range: range,
            });
            return {
                content: [{ type: "text", text: JSON.stringify(response.data.values, null, 2) }],
            };
        }
        if (name === "statistical_analysis") {
            const { data, method } = args;
            let result;
            switch (method) {
                case "mean":
                    result = ss.mean(data);
                    break;
                case "median":
                    result = ss.median(data);
                    break;
                case "stddev":
                    result = ss.standardDeviation(data);
                    break;
                case "min":
                    result = ss.min(data);
                    break;
                case "max":
                    result = ss.max(data);
                    break;
                default: throw new Error(`Unknown method: ${method}`);
            }
            return {
                content: [{ type: "text", text: `Result of ${method}: ${result}` }],
            };
        }
        throw new Error(`Tool not found: ${name}`);
    }
    catch (error) {
        return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
        };
    }
});
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Analyst Agent MCP server running on stdio");
}
main().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
});
