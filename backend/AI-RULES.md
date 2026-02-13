# 🤖 AI Development Rules & Architecture

> **Last Updated:** 2026-02-13  
> **Version:** 2.0 - File Upload & Vision API Integration

---

## 📋 **สรุปสถาปัตยกรรมหลัก**

### **1. File Upload System (Phase 2 Complete ✅)**

#### **การทำงาน:**
```
User → Upload → Neon DB (Base64) → Redis (Metadata only) → Claude Vision API
```

#### **ไฟล์สำคัญ:**
- `app/api/upload/route.ts` - Upload endpoint (บันทึกลง Neon)
- `hooks/useChat.ts` - Upload logic + State management
- `components/CommandCenter.tsx` - Upload UI
- `components/DisplayPanel.tsx` - Image display in chat
- `lib/attachment/attachment-persistence.ts` - Database operations
- `lib/agent/orchestrator.ts` - Vision API integration
- `lib/state/redis-state.ts` - Hot state management

#### **Database Schema:**
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

## 🔥 **Critical Design Decisions**

### **1. Base64 Storage Strategy**
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

### **2. Context Window with Images**
**ปัญหา:** AI ต้องเห็นรูปเก่าในบทสนทนา  
**วิธีแก้:** Hydrate attachments จาก Database ก่อนส่งให้ Claude

**Implementation:**
```typescript
// orchestrator.ts
const contextWindow = state.messages.slice(-10);

// 🔥 Hydrate attachments from database
const allAttachmentIds = contextWindow
  .flatMap(m => m.attachments?.map(a => a.id) || []);
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

### **3. Foreign Key Constraints**
**ปัญหา:** Upload ก่อนสร้าง Conversation → FK constraint error  
**วิธีแก้:** ทำ `conversation_id` และ `user_id` เป็น NULLABLE

```sql
-- ❌ ผิด
conversation_id UUID REFERENCES conversations(id) NOT NULL

-- ✅ ถูก
conversation_id UUID REFERENCES conversations(id) -- nullable
```

**เหตุผล:**
- User อาจจะ upload รูปก่อนส่งข้อความแรก
- Conversation ยังไม่ถูกสร้างใน Database
- Update `conversation_id` ทีหลังเมื่อส่งข้อความแรก

---

## 🛠️ **Common Issues & Solutions**

### **Issue 1: AI ไม่เห็นรูปเก่า**
**สาเหตุ:** Base64 ไม่ถูกส่งใน Context Window  
**วิธีแก้:** ตรวจสอบว่า `getAttachmentsByIds` ถูกเรียกใน orchestrator

### **Issue 2: Upload ล้มเหลว (FK constraint)**
**สาเหตุ:** `conversation_id` ไม่มีใน `conversations` table  
**วิธีแก้:** ส่ง `null` แทน UUID ที่ยังไม่มีจริง

### **Issue 3: Redis เต็ม**
**สาเหตุ:** เก็บ Base64 ใน Redis  
**วิธีแก้:** Strip Base64 ก่อนบันทึก (ดู `redis-state.ts`)

---

## 📁 **File Structure**

```
backend/
├── app/
│   ├── api/
│   │   ├── upload/route.ts          # Upload endpoint
│   │   └── chat/route.ts            # Chat endpoint (รับ attachments)
│   └── components/
│       ├── CommandCenter.tsx        # Upload UI
│       └── DisplayPanel.tsx         # Image display
├── hooks/
│   └── useChat.ts                   # Upload logic + State
├── lib/
│   ├── agent/
│   │   └── orchestrator.ts          # Vision API + Context hydration
│   ├── attachment/
│   │   ├── attachment-persistence.ts # DB operations
│   │   ├── error-handler.ts         # Error handling
│   │   └── vision-analyzer.ts       # Claude Vision integration
│   └── state/
│       └── redis-state.ts           # Hot state (NO base64!)
└── drizzle/
    └── schema.ts                    # Database schema
```

---

## 🚀 **Development Workflow**

### **Adding New Features:**
1. ✅ ออกแบบ Database Schema ก่อน
2. ✅ ตรวจสอบว่า Redis จะเก็บอะไร (ห้ามเก็บข้อมูลใหญ่!)
3. ✅ สร้าง API endpoint
4. ✅ เพิ่ม Frontend UI
5. ✅ ทดสอบ End-to-End

### **Debugging:**
1. เช็ค Console Logs (`console.log` ใน orchestrator)
2. เช็ค Redis (`redis.get('conv:...')`)
3. เช็ค Database (`SELECT * FROM attachments`)
4. เช็ค Network Tab (DevTools)

---

## ⚠️ **ข้อห้าม (DO NOT)**

❌ **ห้าม** เก็บ Base64 ใน Redis  
❌ **ห้าม** ใช้ `NOT NULL` กับ `conversation_id` ใน attachments  
❌ **ห้าม** ส่ง attachments โดยไม่มี `id`  
❌ **ห้าม** ลืม hydrate attachments ใน context window  
❌ **ห้าม** hard-code `userId` (ใช้ `null` ถ้ายังไม่มี auth)

---

## ✅ **Best Practices**

✅ **ต้อง** เก็บ Base64 ใน Database เท่านั้น  
✅ **ต้อง** ดึง Base64 จาก Database ตอนต้องใช้  
✅ **ต้อง** Strip Base64 ก่อนบันทึกลง Redis  
✅ **ต้อง** Hydrate attachments ก่อนส่งให้ Claude  
✅ **ต้อง** ใช้ `getAttachmentsByIds` สำหรับ bulk fetch

---

## 📞 **Contact & Support**

หากมีปัญหา ตรวจสอบ:
1. Console Logs
2. Redis State
3. Database Records
4. Network Requests

**Happy Coding! 🚀**
