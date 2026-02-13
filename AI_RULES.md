# 🚨 กฎเหล็กสำหรับ AI AGENTS (MANDATORY RULES) 🚨

เพื่อความสะดวกและรวดเร็วของ USER ในการรันคำสั่ง:

### 1. ❌ ห้ามใช้ `run_command` tool ที่สร้างปุ่ม "Run/Reject"
ผู้ใช้มีปัญหาในการใช้งาน (คลิกยาก/ช้า/วางไม่ได้)

### 2. ✅ ต้องส่งคำสั่งเป็น Code Block เท่านั้น
เพื่อให้ผู้ใช้กดปุ่ม `<` (Insert to Terminal) ที่มุมขวาบนของกล่องข้อความได้ทันที

**ตัวอย่างที่ถูกต้อง:**
```powershell
npm run dev
```

**ตัวอย่างที่ผิด:**
(การใช้ Tool run_command ที่ผู้ใช้ต้องกด Approve)

---
*บันทึกเมื่อ: 2026-02-06 โดยคำขอของ User "ฉันเหนื่อยยย"* 

---

# 🤖 Specialized AI Agents - Technical Rules & Configuration
**Last Updated:** 2026-02-09
**Status:** Universe Crown Edition (Stable)

## 🎨 UI/UX Design System (Premium)
ระบบถูกออกแบบใหม่ทั้งหมดตาม Concept "Universe Crown Edition" โดยเน้นความสมมาตร ความสะอาดตา และการใช้งานระดับมืออาชีพ

### 1. Color Palette (Inline Styles Required)
เนื่องจากปัญหา Tailwind v4 Dynamic Classes บางครั้งสีอาจไม่แสดงผล ให้ใช้ **Inline Styles** สำหรับ interactive elements ที่เป็น Dynamic Color
- **Code Specialist:** `#5E9BEB` (Blue)
- **Creative Director:** `#EB5463` (Red/Pink)
- **Data Strategist:** `#FFCE55` (Yellow)
- **Growth Hacker:** `#9FD369` (Green)
- **Background:** `#EFF2F9` (Light Blue-Grey)

### 2. Typography
- **Font Family:** `Sarabun` (Google Fonts)
- **Rules:**
  - `type-h1`: 36px/48px Bold (Slate-700)
  - `type-h2`: 24px Bold (Slate-800)
  - `type-body`: 16px Regular (Slate-600)
  - **User Text:** ใช้ `color: #FFFFFF` (Pure White) + `font-semibold` เสมอ เพื่อ Contrast สูงสุดบนพื้น Slate-800
  - **AI Text:** ใช้ `text-slate-600` (Deep Gray) เพื่อความสบายตา

### 3. Layout Architecture
- **Structure:** 2-Column Standard (Left 5 : Right 7)
- **Behavior:** `CommandCenter` (Left) ถูกตรึงไว้ด้วย `sticky top-12` (Freeze) ไม่ขยับตามการ Scroll ฝั่งขวา
- **Responsive:** Mobile จะเรียง Stack กันปกติ (ไม่ Sticky)

### 4. Tailwind CSS v4 Configuration
**สำคัญมาก!** ระบบใช้ Tailwind v4 ซึ่งต้องการ Config เฉพาะ:
- **dependency:** `@tailwindcss/postcss` (ห้ามใช้ `tailwindcss` plugin เก่า)
- **postcss.config.js:**
  ```js
  module.exports = {
    plugins: {
      '@tailwindcss/postcss': {}, // Must use this package
    },
  }
  ```
- **globals.css:** ใช้ `@import "tailwindcss";` แทน `@tailwind base;`

---

## ⚙️ Core Logic & State Management

### 1. Voice Input (Robust Handling)
- **Input Sync:** Voice Input -> Chat Input จะ Sync เฉพาะเมื่อมีค่าใหม่เท่านั้น เพื่อป้องกัน Loop
- **Auto Clear:** เมื่อ `onSend` ทำงาน -> `voice.setInput('')` จะถูกเรียกทันทีเพื่อเคลียร์ค่าค้าง

### 2. Session Management
- **Current Behavior:** Session ID เปลี่ยนใหม่ทุกครั้งที่ Refresh หรือ Load หน้าเว็บ (`Math.random()`)
- **Reason:** เพื่อความปลอดภัยและเริ่ม Context ใหม่เสมอ (Stateless Session)
- **Note:** หากต้องการ Persistent Session ในอนาคต ต้องแก้ `DisplayPanel` ให้ดึง ID จาก `localStorage`

### 3. Hydration Error Fixes
- ใช้ `useEffect` ในการสร้าง ID แบบสุ่ม เพื่อให้ Server และ Client Render ตรงกันเสมอ

---

## 🚫 สิ่งที่ห้ามทำ (Do Not Touch)
1. **ห้ามลบ `postcss.config.js`:** จะทำให้ CSS พังทั้งระบบ
2. **ห้ามเปลี่ยน `bg-slate-800` ของ User Bubble:** เป็นสีที่ User approve แล้วว่าเหมาะสมกับ Text สีขาว
3. **ห้ามเอา `sticky` ออกจาก Left Column:** จะทำให้ UX เสีย (วงแตก)

*บันทึกโดย: Antigravity Agent (Code Specialist)*

---

# 📁 File Upload System & Vision API Integration
**Added:** 2026-02-13  
**Status:** Phase 2 Complete ✅

## 🎯 Architecture Overview

### Data Flow:
```
User → Upload → Neon DB (Base64) → Redis (Metadata only) → Claude Vision API
```

### Key Components:
- `app/api/upload/route.ts` - Upload endpoint (บันทึกลง Neon)
- `hooks/useChat.ts` - Upload logic + State management
- `components/CommandCenter.tsx` - Upload UI
- `components/DisplayPanel.tsx` - Image display in chat
- `lib/attachment/attachment-persistence.ts` - Database operations
- `lib/agent/orchestrator.ts` - Vision API integration
- `lib/state/redis-state.ts` - Hot state management

---

## 🔥 Critical Design Decisions

### 1. Base64 Storage Strategy (MUST FOLLOW!)

**❌ ห้าม:** เก็บ Base64 ใน Redis (ใหญ่เกินไป ~1MB/รูป)  
**✅ ต้อง:** เก็บ Base64 ใน Neon Database (`metadata.base64`)  
**✅ ต้อง:** Redis เก็บแค่ metadata (id, filename, mimeType)

**เหตุผล:**
- Redis มี memory limit
- Base64 ใหญ่มาก (1 รูป = 1-5MB)
- ดึงจาก Database ตอนต้องใช้เท่านั้น (lazy loading)

**Implementation:**
```typescript
// ❌ ผิด - เก็บ Base64 ใน Redis
await redis.set('conv:123', {
  messages: [{ attachments: [{ metadata: { base64: '...' } }] }]
});

// ✅ ถูก - เก็บแค่ ID
await redis.set('conv:123', {
  messages: [{ attachments: [{ id: 'abc', filename: 'cat.jpg' }] }]
});

// ดึง Base64 จาก Database ตอนต้องใช้
const attachments = await getAttachmentsByIds(['abc']);
```

---

### 2. Context Window with Images

**ปัญหา:** AI ต้องเห็นรูปเก่าในบทสนทนา  
**วิธีแก้:** Hydrate attachments จาก Database ก่อนส่งให้ Claude

**Implementation in `orchestrator.ts`:**
```typescript
// Collect attachment IDs from context
const allAttachmentIds = contextWindow
  .flatMap(m => m.attachments?.map(a => a.id) || []);

// Fetch base64 from database
const hydratedAttachments = await getAttachmentsByIds(allAttachmentIds);

// Map back to messages
const messages = contextWindow.map(m => ({
  role: m.role,
  content: m.role === 'user' && m.attachments
    ? buildVisionContent(m.content, hydrateAttachments(m.attachments))
    : m.content
}));
```

---

### 3. Foreign Key Constraints

**ปัญหา:** Upload ก่อนสร้าง Conversation → FK constraint error  
**วิธีแก้:** ทำ `conversation_id` และ `user_id` เป็น NULLABLE

```sql
-- ❌ ผิด
conversation_id UUID REFERENCES conversations(id) NOT NULL

-- ✅ ถูก
conversation_id UUID REFERENCES conversations(id) -- nullable
```

---

## 📊 Database Schema

```sql
-- attachments table
CREATE TABLE attachments (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id), -- NULLABLE
  user_id UUID REFERENCES users(id), -- NULLABLE
  filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(50) NOT NULL,
  size INTEGER NOT NULL,
  url TEXT NOT NULL,
  storage_key VARCHAR(255),
  metadata JSONB, -- Contains base64 data
  uploaded_at TIMESTAMP DEFAULT NOW()
);

-- image_analyses table
CREATE TABLE image_analyses (
  id UUID PRIMARY KEY,
  attachment_id UUID REFERENCES attachments(id),
  agent_type VARCHAR(50),
  analysis TEXT,
  summary TEXT,
  confidence NUMERIC,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## ⚠️ ข้อห้ามเพิ่มเติม (DO NOT)

❌ **ห้าม** เก็บ Base64 ใน Redis  
❌ **ห้าม** ใช้ `NOT NULL` กับ `conversation_id` ใน attachments  
❌ **ห้าม** ส่ง attachments โดยไม่มี `id`  
❌ **ห้าม** ลืม hydrate attachments ใน context window  

---

## ✅ Best Practices เพิ่มเติม

✅ **ต้อง** เก็บ Base64 ใน Database เท่านั้น  
✅ **ต้อง** ดึง Base64 จาก Database ตอนต้องใช้  
✅ **ต้อง** Strip Base64 ก่อนบันทึกลง Redis  
✅ **ต้อง** Hydrate attachments ก่อนส่งให้ Claude  
✅ **ต้อง** ใช้ `getAttachmentsByIds` สำหรับ bulk fetch

---

*บันทึกโดย: Antigravity Agent - File Upload System Implementation*

