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
