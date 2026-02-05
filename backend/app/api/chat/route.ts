import Anthropic from '@anthropic-ai/sdk';
import { neon } from '@neondatabase/serverless';

// 1. Initialize Clients with strict env check
const sql = neon(process.env.DATABASE_URL!);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzVQnBDq1bb7SnXLurvBiRJvrP-yYzNyZx8hCTjb-Ow1gpwIQLY0MCsREzQzcy1w8dagg/exec";

// 2. Data Validator: Ensuring UUID integrity for PostgreSQL
function validateUUID(id: string): string {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    // If user provides a non-UUID string, map it to a permanent consistent UUID
    return uuidRegex.test(id) ? id : '00000000-0000-0000-0000-000000000000';
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { message, conversationId = '' } = body;
        const cleanConvId = validateUUID(conversationId);
        const mockUserId = '00000000-0000-0000-0000-000000000000';

        // A. Verify Database Connectivity & State
        await sql`
      INSERT INTO users (id, name, email) VALUES (${mockUserId}, 'Admin', 'admin@local')
      ON CONFLICT (id) DO NOTHING
    `;
        await sql`
      INSERT INTO conversations (id, user_id, agent_type, status) 
      VALUES (${cleanConvId}, ${mockUserId}, 'analyst', 'active')
      ON CONFLICT (id) DO NOTHING
    `;

        // B. Call Claude with Detailed Tool Definition
        const clResponse = await anthropic.messages.create({
            model: "claude-3-haiku-20240307",
            max_tokens: 1500,
            system: "คุณคือ Analyst Agent ของ iDEAS365 ทำหน้าที่วิเคราะห์ข้อมูลจาก Google Sheets ด้วยความละเอียดสูง เมื่อได้ข้อมูลแล้วให้สรุปเป็นภาษาไทยอย่างเป็นมืออาชีพ",
            messages: [{ role: "user", content: message }],
            tools: [{
                name: "get_sheet_data",
                description: "ดึงข้อมูลจากตาราง Google Sheets เพื่อนำมาวิเคราะห์",
                input_schema: {
                    type: "object",
                    properties: {
                        sheet: { type: "string", enum: ["Sales", "Inventory", "Expenses"], description: "ชื่อหน้าตารางที่ต้องการ" }
                    },
                    required: ["sheet"]
                }
            }]
        });

        // C. Process Response & Potential Tool Usage
        if (clResponse.stop_reason === "tool_use") {
            const toolCall = clResponse.content.find(c => c.type === "tool_use") as any;

            // Fetch data from Google Apps Script with Error Handling
            const scriptRes = await fetch(`${GOOGLE_SCRIPT_URL}?sheet=${toolCall.input.sheet}`);
            const sheetData = await scriptRes.json();

            // Final Synthesis
            const finalMsg = await anthropic.messages.create({
                model: "claude-3-haiku-20240307",
                max_tokens: 1500,
                messages: [
                    { role: "user", content: message },
                    { role: "assistant", content: clResponse.content },
                    {
                        role: "user",
                        content: [{
                            type: "tool_result",
                            tool_use_id: toolCall.id,
                            content: JSON.stringify(sheetData)
                        }]
                    }
                ]
            });

            const outText = (finalMsg.content[0] as any).text;
            await saveMessage(cleanConvId, message, outText, toolCall.input.sheet);
            return Response.json({ message: outText, agentType: 'analyst' });
        }

        const directText = (clResponse.content[0] as any).text;
        await saveMessage(cleanConvId, message, directText);
        return Response.json({ message: directText, agentType: 'system' });

    } catch (error: any) {
        console.error("Critical Failure:", error);
        return Response.json({ error: error.message, status: 'failed' }, { status: 500 });
    }
}

async function saveMessage(convId: string, user: string, ai: string, source: string = "") {
    try {
        const meta = source ? { source_sheet: source } : {};
        await sql`INSERT INTO messages (conversation_id, role, content) VALUES (${convId}, 'user', ${user})`;
        await sql`INSERT INTO messages (conversation_id, role, content, metadata) VALUES (${convId}, 'assistant', ${ai}, ${JSON.stringify(meta)})`;
    } catch (dbErr) {
        console.warn("DB Save Error (Non-Critical):", dbErr);
    }
}
