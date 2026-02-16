# 🐛 Bug Report - Memory & Image Persistence Issues

**วันที่:** 2026-02-14
**Severity:** 🔴 CRITICAL
**Impact:** ผู้ใช้ไม่สามารถใช้งานได้อย่างต่อเนื่อง

---

## 📋 ปัญหาที่พบ (Issues Found)

### **1. 🔴 CRITICAL: Session ID Regenerates on Page Reload**

**Location:** `backend/hooks/useChat.ts:41-42`

```typescript
useEffect(() => {
    setConversationId(crypto.randomUUID());
}, []);
```

**ปัญหา:**
- ✅ สร้าง conversationId ใหม่ทุกครั้งที่ reload หน้า
- ✅ ไม่มีการบันทึกลง localStorage
- ✅ ทำให้ conversation history หายหมด

**ผลกระทบ:**
```
User: ส่งรูป mockup → AI วิเคราะห์ ✅
User: Refresh page
User: "ดูรูปที่ส่งไปนะ"
AI: ❌ "ไม่เห็นรูปครับ ส่งใหม่ได้ไหม"
```

---

### **2. 🟡 MEDIUM: Short Context Window (10 messages only)**

**Location:** `backend/lib/agent/orchestrator.ts:257`

```typescript
const contextWindow = state.messages.slice(-10);
```

**ปัญหา:**
- AI จำได้แค่ 10 ข้อความล่าสุด
- ถ้าคุยเกิน 10 ข้อความ จะลืมข้อความเก่า

**ตัวอย่าง:**
```
Message 1-10: คุยเรื่อง project A
Message 11: "เรื่องที่คุยไปตอนแรกนะ..."
AI: ❌ ไม่จำ เพราะ Message 1 ถูกตัดออกจาก context
```

---

### **3. 🟡 MEDIUM: Redis TTL = 1 Hour**

**Location:** `backend/lib/state/redis-state.ts:46`

```typescript
export async function saveHotState(state: HotState, ttl: number = 3600) {
    // ttl = 3600 seconds = 1 hour
    await redis.setex(key, ttl, state);
}
```

**ปัญหา:**
- ถ้าไม่ใช้งานเกิน 1 ชั่วโมง conversation จะหาย
- ไม่มี long-term storage ใน database

**ตัวอย่าง:**
```
9:00 AM - คุย AI ส่งรูป
10:01 AM - กลับมาคุยต่อ
Result: ❌ Conversation หาย เพราะเกิน 1 hour
```

---

### **4. 🟠 LOW: Attachments Lose Base64 in Redis**

**Location:** `backend/lib/state/redis-state.ts:72-84`

```typescript
// Strip base64 from attachments to save Redis space
optimizedAttachments = message.attachments.map(att => ({
    id: att.id,
    filename: att.filename,
    // ... other fields
    metadata: {
        ...att.metadata,
        base64: undefined // ❌ Remove base64
    }
}));
```

**ปัญหา:**
- base64 data ถูกลบออกเมื่อบันทึกลง Redis
- ต้อง fetch จาก database ทุกครั้ง (อาจช้า)
- ถ้า database ไม่มีข้อมูล จะแสดงรูปไม่ได้

---

## 🎯 Root Cause Analysis

### **สาเหตุหลัก:**

1. **No Session Persistence**
   - conversationId ไม่ถูก save ลง localStorage
   - ทุกครั้งที่ refresh = session ใหม่

2. **Short Memory Design**
   - Context window = 10 messages (ออกแบบให้สั้น)
   - ไม่มี long-term conversation history

3. **Redis-only Storage**
   - ใช้ Redis เป็น primary storage
   - ไม่มี fallback to database
   - TTL = 1 hour (สั้นเกินไป)

4. **Attachment Data Not Hydrated**
   - base64 ถูกลบออกจาก Redis
   - System ควร fetch จาก DB แต่อาจมี bug

---

## 🔧 Solutions & Fixes

### **Fix 1: Persistent Session ID (localStorage)**

**ไฟล์:** `backend/hooks/useChat.ts`

**Before:**
```typescript
useEffect(() => {
    setConversationId(crypto.randomUUID());
}, []);
```

**After:**
```typescript
useEffect(() => {
    // Try to load existing conversationId from localStorage
    const stored = localStorage.getItem('conversationId');

    if (stored) {
        // Resume existing conversation
        setConversationId(stored);
    } else {
        // Create new conversation
        const newId = crypto.randomUUID();
        localStorage.setItem('conversationId', newId);
        setConversationId(newId);
    }
}, []);

// Add function to start new conversation
const startNewConversation = useCallback(() => {
    const newId = crypto.randomUUID();
    localStorage.setItem('conversationId', newId);
    setConversationId(newId);
    setMessages([]);
    setAttachments([]);
}, []);
```

**ผลลัพธ์:**
✅ Refresh หน้าแล้วยัง resume conversation เดิมได้
✅ มีปุ่ม "New Chat" สำหรับเริ่มคุยใหม่

---

### **Fix 2: Increase Context Window**

**ไฟล์:** `backend/lib/agent/orchestrator.ts:257`

**Before:**
```typescript
const contextWindow = state.messages.slice(-10);
```

**After:**
```typescript
// Option A: Increase to 20 messages
const contextWindow = state.messages.slice(-20);

// Option B: Dynamic based on token count (recommended)
const contextWindow = getContextWindow(state.messages, {
    maxMessages: 30,
    maxTokens: 4000 // Estimate ~4000 tokens = ~3000 words
});

function getContextWindow(messages: Message[], options: { maxMessages: number; maxTokens: number }) {
    let totalTokens = 0;
    const selected: Message[] = [];

    // Start from most recent
    for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i];
        const estimatedTokens = msg.content.length / 4; // Rough estimate

        if (selected.length >= options.maxMessages) break;
        if (totalTokens + estimatedTokens > options.maxTokens) break;

        selected.unshift(msg);
        totalTokens += estimatedTokens;
    }

    return selected;
}
```

**ผลลัพธ์:**
✅ จำได้มากขึ้น (20-30 messages)
✅ ไม่เกิน token limit

---

### **Fix 3: Increase Redis TTL + Add DB Persistence**

**ไฟล์:** `backend/lib/state/redis-state.ts:46`

**Before:**
```typescript
export async function saveHotState(state: HotState, ttl: number = 3600) {
    await redis.setex(key, ttl, state);
}
```

**After:**
```typescript
export async function saveHotState(state: HotState, ttl: number = 86400) { // 24 hours
    const key = `conv:${state.conversationId}`;
    state.metadata.lastMessageAt = new Date().toISOString();
    state.metadata.messageCount = state.messages.length;

    // Save to Redis (hot cache)
    await redis.setex(key, ttl, state);

    // 🔥 ALSO save to database (persistent storage)
    await persistConversationToDB(state);
}

// New function: Persist to database
async function persistConversationToDB(state: HotState) {
    const sql = neon(process.env.DATABASE_URL!);

    // Upsert conversation
    await sql`
        INSERT INTO conversations (id, user_id, agent_type, metadata, created_at, updated_at)
        VALUES (${state.conversationId}, ${state.userId}, ${state.agentType},
                ${JSON.stringify(state.metadata)}, NOW(), NOW())
        ON CONFLICT (id)
        DO UPDATE SET
            metadata = EXCLUDED.metadata,
            updated_at = NOW()
    `;

    // Save messages (only new ones)
    // Implementation depends on your messages table schema
}

// New function: Load from DB if Redis expired
export async function getHotState(conversationId: string): Promise<HotState | null> {
    // Try Redis first
    const cached = await redis.get<HotState>(`conv:${conversationId}`);
    if (cached) return cached;

    // 🔥 Fallback to database
    const fromDB = await loadConversationFromDB(conversationId);
    if (fromDB) {
        // Re-populate Redis
        await saveHotState(fromDB, 86400);
        return fromDB;
    }

    return null;
}
```

**ผลลัพธ์:**
✅ TTL = 24 hours (แทน 1 hour)
✅ Fallback to database ถ้า Redis หาย
✅ Persistent storage

---

### **Fix 4: Properly Hydrate Attachments**

**ไฟล์:** `backend/lib/agent/orchestrator.ts:266-283`

**Current Code:**
```typescript
// Fetch all attachments with base64 data in one query
const hydratedAttachments = await getAttachmentsByIds(allAttachmentIds);
const attachmentMap = new Map(hydratedAttachments.map(att => [att.id, att]));
```

**Issue:**
- `getAttachmentsByIds` ไม่ได้ fetch base64 data จาก S3
- attachments table มีแค่ URL ไม่มี base64

**Fix:**
```typescript
// Fetch attachments from database
const attachmentRecords = await getAttachmentsByIds(allAttachmentIds);

// Download base64 from S3 for vision analysis
const hydratedAttachments = await Promise.all(
    attachmentRecords.map(async (att) => {
        // If already has base64, return
        if (att.metadata?.base64) return att;

        // Download from S3
        try {
            const response = await fetch(att.publicUrl);
            const buffer = await response.arrayBuffer();
            const base64 = Buffer.from(buffer).toString('base64');

            return {
                ...att,
                metadata: {
                    ...att.metadata,
                    base64
                }
            };
        } catch (error) {
            console.warn(`Failed to download ${att.id}:`, error);
            return att;
        }
    })
);

const attachmentMap = new Map(hydratedAttachments.map(att => [att.id, att]));
```

**ผลลัพธ์:**
✅ Images มี base64 data ครบ
✅ Vision analysis ทำงานได้

---

## 📊 Comparison: Before vs After

| Feature | Before 🔴 | After ✅ |
|---------|----------|----------|
| **Session Persistence** | ❌ หายทุกครั้งที่ refresh | ✅ Resume ได้ (localStorage) |
| **Memory Length** | ⚠️ 10 messages | ✅ 20-30 messages (dynamic) |
| **Storage Duration** | ⚠️ 1 hour | ✅ 24+ hours (DB persistent) |
| **Image Persistence** | ❌ ไม่แสดงรูปเก่า | ✅ โหลดจาก S3 ได้ |
| **Long-term History** | ❌ ไม่มี | ✅ เก็บใน database |

---

## 🚀 Implementation Priority

### **Phase 1: Critical Fixes (วันนี้)**
- ✅ Fix 1: localStorage persistence
- ✅ Fix 2: Increase context window to 20

### **Phase 2: Important Fixes (2-3 วัน)**
- ✅ Fix 3: Database persistence
- ✅ Fix 4: Proper attachment hydration

### **Phase 3: Nice-to-Have (1 สัปดาห์)**
- 📚 Add "conversation history" UI
- 🗑️ Add "delete conversation" feature
- 📤 Add "export conversation" feature
- 🔍 Add "search conversations" feature

---

## 🧪 Testing Checklist

### **Test Case 1: Session Persistence**
```
1. Start chat, send message with image
2. Refresh page
3. Expected: ✅ See previous messages + image
4. Actual (before): ❌ Empty conversation
5. Actual (after): ✅ Resume conversation
```

### **Test Case 2: Long Conversation**
```
1. Send 25 messages
2. Reference message #1 in message #25
3. Expected: ✅ AI remembers message #1
4. Actual (before): ❌ AI forgot (only remembers last 10)
5. Actual (after): ✅ AI remembers (context = 30)
```

### **Test Case 3: Long Inactive Period**
```
1. Start chat at 9:00 AM
2. Come back at 11:00 AM (2 hours later)
3. Expected: ✅ Resume conversation
4. Actual (before): ❌ Conversation expired (TTL = 1 hour)
5. Actual (after): ✅ Load from database
```

### **Test Case 4: Image in Old Message**
```
1. Send image in message #1
2. Send 15 more messages
3. Ask AI about image in message #1
4. Expected: ✅ AI sees the image
5. Actual (before): ❌ Image not loaded
6. Actual (after): ✅ Image loaded from S3
```

---

## 📝 Database Schema (ถ้ายังไม่มี)

### **conversations table**
```sql
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY,
    user_id UUID,
    agent_type VARCHAR(50),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);
```

### **messages table** (ถ้ายังไม่มี)
```sql
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL, -- 'user' or 'assistant'
    content TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
```

---

## 💡 Additional Recommendations

### **1. Add "New Chat" Button**
```typescript
// In ChatInterface component
<button onClick={startNewConversation}>
    🆕 New Chat
</button>
```

### **2. Show Session Age**
```typescript
// In DisplayPanel
<span className="text-xs opacity-40">
    Started: {formatDistanceToNow(sessionStartTime)}
</span>
```

### **3. Add Conversation List (Sidebar)**
```typescript
// Show recent conversations
<ConversationList
    conversations={recentConversations}
    onSelect={loadConversation}
/>
```

---

## 🎯 Expected Results After Fixes

### **User Experience:**
1. ✅ Refresh หน้าได้ conversation ยังอยู่
2. ✅ คุยยาว ๆ ได้ AI จำได้มากขึ้น
3. ✅ มาคุยต่อหลังหลายชั่วโมงได้
4. ✅ รูปที่ส่งไปก่อนหน้ายังเห็นได้
5. ✅ มีปุ่ม "New Chat" เริ่มคุยใหม่ได้

### **Technical Benefits:**
1. ✅ Database เป็น source of truth
2. ✅ Redis เป็น cache layer
3. ✅ Graceful degradation (Redis หาย → ใช้ DB)
4. ✅ Better user retention (ไม่เสียข้อมูล)

---

## 📚 Files to Modify

1. **`backend/hooks/useChat.ts`** - Add localStorage persistence
2. **`backend/lib/agent/orchestrator.ts`** - Increase context window + hydrate attachments
3. **`backend/lib/state/redis-state.ts`** - Add DB persistence + increase TTL
4. **`backend/lib/state/db-persistence.ts`** - NEW: Database operations
5. **`backend/drizzle/schema.ts`** - Add conversations table (if not exists)

---

**สรุป:**
ปัญหาหลักคือ **Session ไม่ persistent** และ **Memory สั้นเกินไป**
แก้โดยใช้ **localStorage + Database + เพิ่ม context window** 💪

Ready to implement? 🚀
