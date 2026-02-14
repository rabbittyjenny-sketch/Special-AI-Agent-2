# MCP Integration Guide
## Integrating MCP Servers with Special AI Agent

เอกสารนี้อธิบายวิธีการเชื่อมต่อ MCP Servers เข้ากับระบบ AI Agent ของเรา

---

## 📋 สิ่งที่ติดตั้งเรียบร้อยแล้ว

### ✅ MCP Servers ที่พร้อมใช้งาน:

1. **Chat History Server** (`mcp-servers/chat-history-server.js`)
   - บันทึกและค้นหาประวัติการสนทนา
   - เก็บข้อมูลใน `data/chat-history.json`

2. **Filesystem Server** (`mcp-servers/filesystem-server.js`)
   - อ่าน/เขียนไฟล์อย่างปลอดภัย
   - จำกัดการเข้าถึงเฉพาะโฟลเดอร์ที่กำหนด

### ✅ Configuration Files:

- `.claude/mcp_settings.json` - การตั้งค่า MCP servers
- `mcp-servers/package.json` - Dependencies สำหรับ MCP
- `mcp-servers/README.md` - เอกสารประกอบ

---

## 🚀 วิธีใช้งาน MCP Servers

### 1. ทดสอบ MCP Servers

```bash
# ทดสอบ Chat History Server
cd /home/user/Special-AI-Agent-2/mcp-servers
node test-chat-history.js

# รัน Chat History Server แบบ manual
node chat-history-server.js

# รัน Filesystem Server แบบ manual
ALLOWED_DIRECTORIES="./backend,./mcp-servers" node filesystem-server.js
```

### 2. เชื่อมต่อกับ Frontend (Next.js)

สร้างไฟล์ `backend/lib/mcp-client.ts`:

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';

export class MCPChatHistory {
  private client: Client;
  private transport: StdioClientTransport;
  private connected: boolean = false;

  constructor() {
    this.client = new Client({
      name: 'special-ai-agent-client',
      version: '1.0.0',
    }, {
      capabilities: {}
    });
  }

  async connect() {
    if (this.connected) return;

    // Start MCP server process
    const serverProcess = spawn('node', [
      './mcp-servers/chat-history-server.js'
    ]);

    this.transport = new StdioClientTransport({
      command: 'node',
      args: ['./mcp-servers/chat-history-server.js']
    });

    await this.client.connect(this.transport);
    this.connected = true;
  }

  async saveMessage(sessionId: string, agentType: string, role: 'user' | 'assistant', content: string, metadata?: any) {
    await this.connect();

    return await this.client.callTool({
      name: 'save_message',
      arguments: {
        sessionId,
        agentType,
        role,
        content,
        metadata
      }
    });
  }

  async getSessionHistory(sessionId: string) {
    await this.connect();

    return await this.client.callTool({
      name: 'get_session_history',
      arguments: { sessionId }
    });
  }

  async searchConversations(query: string, agentType?: string, limit: number = 10) {
    await this.connect();

    return await this.client.callTool({
      name: 'search_conversations',
      arguments: { query, agentType, limit }
    });
  }

  async disconnect() {
    if (this.connected && this.transport) {
      await this.transport.close();
      this.connected = false;
    }
  }
}

// Singleton instance
let mcpChatHistory: MCPChatHistory | null = null;

export function getMCPChatHistory() {
  if (!mcpChatHistory) {
    mcpChatHistory = new MCPChatHistory();
  }
  return mcpChatHistory;
}
```

### 3. อัพเดท useChat Hook

แก้ไข `backend/hooks/useChat.ts`:

```typescript
import { getMCPChatHistory } from '@/lib/mcp-client';

// ใน sendMessage function
async sendMessage(agentType: string): Promise<void> {
  if (!input.trim() && attachments.length === 0) return;

  // ... existing code ...

  // บันทึกข้อความของ user ลง MCP
  const mcp = getMCPChatHistory();
  await mcp.saveMessage(
    sessionId, // ใช้ session ID จาก DisplayPanel
    agentType,
    'user',
    input,
    { attachments: attachments.map(a => a.id) }
  );

  // ... send to API ...

  // บันทึก response ของ AI ลง MCP
  await mcp.saveMessage(
    sessionId,
    agentType,
    'assistant',
    data.response,
    { verified: data.verified, confidence: data.confidence }
  );
}
```

### 4. เพิ่ม API Route สำหรับ Chat History

สร้าง `backend/app/api/chat/history/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getMCPChatHistory } from '@/lib/mcp-client';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
  }

  try {
    const mcp = getMCPChatHistory();
    const result = await mcp.getSessionHistory(sessionId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { query, agentType, limit } = await request.json();

  try {
    const mcp = getMCPChatHistory();
    const result = await mcp.searchConversations(query, agentType, limit);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error searching conversations:', error);
    return NextResponse.json({ error: 'Failed to search' }, { status: 500 });
  }
}
```

---

## 📊 ตัวอย่างการใช้งาน

### บันทึก Chat Message

```typescript
const mcp = getMCPChatHistory();

await mcp.saveMessage(
  'session-123',
  'code-specialist',
  'user',
  'Help me fix this bug',
  { priority: 'high' }
);
```

### ดึงประวัติการสนทนา

```typescript
const history = await mcp.getSessionHistory('session-123');
console.log(history.messages);
```

### ค้นหาการสนทนา

```typescript
const results = await mcp.searchConversations('bug fix', 'code-specialist', 5);
console.log(results.results);
```

---

## 🔧 การ Debug

### 1. ตรวจสอบ MCP Server ทำงานหรือไม่

```bash
# รัน server และดู logs
node mcp-servers/chat-history-server.js
```

### 2. ตรวจสอบข้อมูลที่บันทึก

```bash
# ดูข้อมูลใน database file
cat data/chat-history.json | jq
```

### 3. ทดสอบ Tools

```bash
# ใช้ MCP Inspector (ถ้าติดตั้ง)
npx @modelcontextprotocol/inspector mcp-servers/chat-history-server.js
```

---

## 📈 Next Steps

### ขั้นตอนถัดไป:

1. ✅ **ทดสอบ MCP Servers** - ใช้ test scripts
2. ⏳ **สร้าง MCP Client** - เชื่อมต่อ frontend กับ MCP
3. ⏳ **อัพเดท useChat Hook** - บันทึกข้อความอัตโนมัติ
4. ⏳ **สร้าง API Routes** - เพิ่ม endpoints สำหรับ history
5. ⏳ **เพิ่ม UI Features** - แสดงประวัติการสนทนา

### MCP Servers เพิ่มเติม (Future):

- 🔲 **Web Search MCP** - ค้นหาข้อมูลจากอินเทอร์เน็ต
- 🔲 **Code Execution MCP** - รันโค้ดในสภาพแวดล้อมที่ปลอดภัย
- 🔲 **Image Generation MCP** - สร้างภาพด้วย DALL-E
- 🔲 **Email MCP** - ส่งอีเมลและการแจ้งเตือน
- 🔲 **Analytics MCP** - ติดตามการใช้งานและ metrics

---

## 💡 Tips

1. **Security**: MCP Servers ถูกจำกัดการเข้าถึงเฉพาะ local เท่านั้น
2. **Performance**: ใช้ connection pooling สำหรับ production
3. **Error Handling**: ใส่ try-catch ทุกครั้งที่เรียก MCP tools
4. **Logging**: Log ทุก MCP calls เพื่อ debugging

---

## 🆘 หากมีปัญหา

1. ตรวจสอบว่า `@modelcontextprotocol/sdk` ถูกติดตั้งแล้ว
2. ตรวจสอบว่า server files มีสิทธิ์ execute (`chmod +x`)
3. ตรวจสอบ logs ใน stderr ของ MCP server
4. อ่าน error messages ใน console

---

**Documentation Updated**: 2026-02-14
**Version**: 1.0.0
**Author**: iDEAS365
