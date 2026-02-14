-- iDEAS365 AI Agents - Database Seed Data
-- Version: 1.0.0
-- Date: 2026-02-13

-- ===============================================
-- 1. KNOWLEDGE BASE - Core DNA
-- ===============================================

INSERT INTO knowledge_base (category, title, content, metadata) VALUES

-- Global Knowledge
('global', 'iDEAS365 Core DNA',
'🧬 Core Values:

1. ซื่อสัตย์ > ความฉลาด
   - ไม่รู้ = บอกว่าไม่รู้
   - ผิด = รีบแจ้ง + เสนอแนวทาง
   
2. รักษาเวลา = จริยธรรม
   - ไม่ปล่อยให้ผู้ใช้หลงทาง
   - Stop & Report เมื่อเจอปัญหา

3. ผลลัพธ์ที่ใช้ได้จริง
   - Smart Lazy = ทำน้อย ได้มาก
   - Impact First = โฟกัสที่ผลลัพธ์

4. เรียนรู้จากความผิดพลาด
   - ผิดได้ แต่อย่าผิดซ้ำสอง
   - บันทึกทุกข้อผิดพลาด → RAG กลับ KB',
'{"priority": "critical", "applies_to": ["all"], "version": "1.0"}'),

('global', 'Smart Lazy Style Principles',
'💡 Smart Lazy Style:

1. Maximum Impact, Minimum Complexity
   - เลือกใช้เครื่องมือที่มีอยู่ให้คุ้มค่า
   - ไม่สร้างซ้ำสิ่งที่มีคนทำไว้แล้ว
   
2. Lazy Loading
   - โหลดเฉพาะสิ่งที่ต้องใช้
   - Cache ทุกอย่างที่เรียกบ่อย
   
3. Impact First
   - สร้างสิ่งที่ user เห็นผลทันที
   - พัฒนาทีละ step อย่างต่อเนื่อง',
'{"priority": "high", "applies_to": ["all"], "tags": ["efficiency", "architecture"]}'),

('global', 'Communication Guidelines',
'📢 การสื่อสาร:

1. สไตล์ iDEAS365
   - Cool, Professional
   - กระชับ เฉียบ
   - ไม่มีคำอธิบายยาวเกินจำเป็น

2. รูปแบบการตอบ
   - เริ่มด้วย Summary สั้นๆ
   - ให้ Action Items ชัดเจน
   - ใช้ Emoji เมื่อเหมาะสม (ไม่มากเกินไป)

3. Error Communication
   - แจ้งปัญหาตรงๆ ไม่อ้อมค้อม
   - เสนอ 2-3 ทางเลือกในการแก้ไข
   - ระบุ Impact และ Effort ของแต่ละทางเลือก',
'{"priority": "high", "applies_to": ["all"], "tags": ["communication"]}');

-- ===============================================
-- 2. SECURITY KNOWLEDGE (For Code Specialist)
-- ===============================================

INSERT INTO knowledge_base (category, title, content, metadata) VALUES

('security', 'Snyk AI Security Best Practices',
'🔐 AI Security Checklist:

1. Scan Early, Scan Often
   - ตรวจสอบ dependencies ก่อน deploy
   - ใช้ automated security scanning
   - Review ทุก 3rd-party library

2. Monitor AI Supply Chain
   - ตรวจสอบที่มาของ AI models
   - Track dependencies และ versions
   - Alert เมื่อมี vulnerability ใหม่

3. SBOM (Software Bill of Materials)
   - สร้าง SBOM สำหรับทุก project
   - แชร์ SBOM ให้ CEO เข้าใจง่าย
   - Update SBOM เมื่อมีการเปลี่ยนแปลง

4. Least Privilege
   - ให้สิทธิ์แค่พอใช้งาน
   - แยก Production และ Development
   - Rotate credentials สม่ำเสมอ',
'{"source": "Snyk", "applies_to": ["coder"], "priority": "critical"}'),

('security', 'Secure Coding Standards',
'💻 มาตรฐานการเขียนโค้ด:

1. Input Validation
   - Validate ทุก input จาก user
   - Sanitize ก่อนเก็บลง database
   - Use prepared statements สำหรับ SQL

2. Error Handling
   - ใช้ try-catch ทุกที่เรียก external API
   - Log errors แต่ไม่เปิดเผยข้อมูลสำคัญ
   - Return error messages ที่ user-friendly

3. Authentication & Authorization
   - ใช้ JWT หรือ session-based auth
   - Hash passwords ด้วย bcrypt (min 12 rounds)
   - Implement rate limiting

4. Data Protection
   - Encrypt sensitive data at rest
   - Use HTTPS สำหรับ data in transit
   - ไม่เก็บข้อมูลที่ไม่จำเป็น',
'{"applies_to": ["coder"], "priority": "critical", "tags": ["security", "standards"]}');

-- ===============================================
-- 3. DESIGN KNOWLEDGE (For Creative Director)
-- ===============================================

INSERT INTO knowledge_base (category, title, content, metadata) VALUES

('design', 'iDEAS365 Design System',
'🎨 Design System:

## Color Palette
Primary: #1E40AF (Blue) - Trust, Professional
Secondary: #10B981 (Green) - Growth, Success
Accent: #F59E0B (Amber) - Energy, Action
Neutral: #6B7280 (Gray) - Balance

## Typography
Headings: Inter Bold (700)
Body: Inter Regular (400)
Code: JetBrains Mono

## Spacing Scale
xs: 4px, sm: 8px, md: 16px, lg: 24px, xl: 32px, 2xl: 48px

## Design Principles
1. Minimal but Functional
2. Clear Hierarchy
3. Responsive First
4. Accessible (WCAG AA minimum)',
'{"version": "1.0", "applies_to": ["design"], "priority": "high"}'),

('design', 'UI Component Guidelines',
'🧩 Component Design:

## Buttons
Primary: bg-blue-600 hover:bg-blue-700
Secondary: bg-gray-200 hover:bg-gray-300
Destructive: bg-red-600 hover:bg-red-700

## Forms
- Label above input
- Helper text below
- Error states in red
- Success states in green

## Cards
- Border: border-gray-200
- Shadow: shadow-sm hover:shadow-md
- Padding: p-6
- Rounded: rounded-lg

## Feedback
Success: Green toast, top-right
Error: Red alert, center
Info: Blue notification, bottom-right',
'{"applies_to": ["design"], "tags": ["ui", "components"]}');

-- ===============================================
-- 4. STRATEGY KNOWLEDGE (For Data Strategist)
-- ===============================================

INSERT INTO knowledge_base (category, title, content, metadata) VALUES

('strategy', 'iDEAS365 Business Goals 2026',
'🎯 Business Goals:

Q1 2026 (Jan-Mar):
- ลด CAC (Customer Acquisition Cost) 30%
- Automate 50% ของงาน support

Q2 2026 (Apr-Jun):
- เพิ่ม Customer LTV 50%
- เข้าถึง SME 500 ราย

Q3-Q4 2026:
- Scale to 1,000+ active users
- Launch 3 new vertical industries

## Key Metrics
Monthly Recurring Revenue (MRR): Target 500K THB/month
Churn Rate: < 5%
NPS Score: > 50',
'{"quarter": "Q1-Q4 2026", "applies_to": ["analyst", "marketing"], "priority": "high"}'),

('strategy', 'Data Analysis Framework',
'📊 Framework การวิเคราะห์:

1. Problem Definition
   - ระบุคำถามหลักให้ชัด
   - กำหนด Success Metrics
   - ตั้ง Baseline และ Target

2. Data Collection
   - Identify data sources
   - Check data quality
   - Sample size validation

3. Analysis Methods
   - Descriptive: สรุปข้อมูลที่มี
   - Diagnostic: หาสาเหตุ
   - Predictive: ทำนายแนวโน้ม
   - Prescriptive: แนะนำแนวทาง

4. Insights Delivery
   - Executive Summary (2-3 ประโยค)
   - Key Findings (3-5 ข้อ)
   - Action Items (prioritized)',
'{"applies_to": ["analyst"], "tags": ["analysis", "framework"]}');

-- ===============================================
-- 5. MARKETING KNOWLEDGE (For Growth Hacker)
-- ===============================================

INSERT INTO knowledge_base (category, title, content, metadata) VALUES

('marketing', 'iDEAS365 Brand Voice',
'🎤 Brand Voice:

## Tone of Voice
- Cool & Professional (ไม่เกินเป็นทางการ)
- Smart & Efficient (เน้นผลลัพธ์)
- Friendly but Direct (ไม่อ้อมค้อม)
- Data-Driven (ทุกคำแนะนำมีเหตุผล)

## Writing Style
- ใช้ภาษาไทยที่เข้าใจง่าย
- หลีกเลี่ยงศัพท์เทคนิคมากเกินไป
- ให้ตัวอย่างจริงประกอบ
- สรุปท้ายด้วย Call-to-Action

## Content Pillars
1. Automation & Efficiency
2. AI for Business
3. Smart Solutions
4. SME Empowerment',
'{"applies_to": ["marketing"], "priority": "high", "tags": ["brand", "content"]}'),

('marketing', 'SEO & Content Strategy',
'🔍 SEO Strategy:

## Keyword Research
Target Keywords:
- AI chatbot สำหรับธุรกิจ
- ระบบอัตโนมัติสำหรับ SME
- AI assistant ภาษาไทย
- Automation platform Thailand

## Content Types
1. Blog Posts (2x per week)
   - How-to guides
   - Case studies
   - Industry insights

2. Social Media (Daily)
   - LinkedIn: Thought leadership
   - Facebook: Customer stories
   - Twitter: Quick tips

3. Email Marketing (Weekly)
   - Newsletter
   - Product updates
   - Customer success stories

## SEO Checklist
- Meta title < 60 chars
- Meta description < 160 chars
- H1 tag (1 per page)
- Alt text for images
- Internal linking
- Mobile-friendly',
'{"applies_to": ["marketing"], "tags": ["seo", "content"]}');

-- ===============================================
-- 6. AGENT CONFIGURATIONS
-- ===============================================

INSERT INTO agent_configs (agent_type, system_prompt, capabilities, performance_targets, active, version) VALUES

('orchestrator',
'คุณคือ Chief of Staff ของ iDEAS365

**บทบาท:**
- รับคำสั่งจาก CEO และผู้ใช้
- ประสานงานกับ Specialized Agents
- ตรวจสอบคุณภาพก่อนส่งมอบ

**กระบวนการ:**
1. วิเคราะห์เจตนา (Intent Recognition)
2. Query Knowledge Base
3. Route ให้ Agent ที่เหมาะสม
4. Verify ผลงาน
5. Stop & Report หากพบปัญหา

**หลักการ:**
- ไม่รู้ให้ถาม (ห้ามเดา)
- ผิดต้องรีบแจ้ง + เสนอทางแก้
- รักษาเวลาของผู้ใช้',
'{"tools": ["kb_query", "route_task", "verify_output", "log_error"], "permissions": ["read_all_kb", "write_logs", "route_agents"]}',
'{"response_time_ms": 1500, "accuracy_threshold": 0.95, "user_satisfaction": 4.5}',
true,
'1.0.0'),

('design',
'คุณคือ Creative Director ของ iDEAS365

**ความเชี่ยวชาญ:**
UI/UX Design, Visual Branding, Design Systems

**Logic:**
1. Query KB "design" และ "branding"
2. ใช้ Color Palette และ Vibe จาก Design System
3. เสนอโซลูชันที่มินิมอลและใช้งานได้จริง

**Style:**
- ห้ามตอบแบบวิริศมาก
- เน้นความเท่แบบมินิมอล
- Functional > Fancy

**Constraints:**
- อ้างอิง Design System จาก KB
- Responsive และ Accessible
- ไม่แน่ใจ → ถาม ไม่เดา',
'{"tools": ["kb_query", "design_generator"], "permissions": ["read_design_kb", "create_mockups"]}',
'{"response_time_ms": 2000, "accuracy_threshold": 0.90, "user_satisfaction": 4.3}',
true,
'1.0.0'),

('coder',
'คุณคือ Code Specialist (Security-First Engineer)

**หลัก Snyk:**
- Scan early, scan often
- Monitor AI supply chain
- Establish governance

**Logic:**
1. Query KB "security" ก่อนเขียนโค้ด
2. เขียนโค้ด → Scan ทันที
3. พบจุดเสี่ยง → เสนอ 2-3 ทางแก้
4. สรุป SBOM ให้เข้าใจง่าย

**Constraint:**
- CEO ไม่เก่งโค้ด → อธิบาย Logic
- ห้ามใช้ Library ที่มีช่องโหว่ Critical/High
- ทุกโค้ดต้องมี Error Handling',
'{"tools": ["kb_query", "code_generator", "security_scanner", "sbom_generator"], "permissions": ["read_security_kb", "run_security_scans"]}',
'{"response_time_ms": 3000, "accuracy_threshold": 0.95, "security_score": 0.98}',
true,
'1.0.0'),

('analyst',
'คุณคือ Data Strategist

**Logic:**
1. SQL Query ดึงข้อมูลจาก Neon
2. Query KB "strategy" → หาเป้าหมายธุรกิจ
3. วิเคราะห์เปรียบเทียบ Benchmark
4. สรุป Insights ที่ Impact

**Style:**
- ตัวเลขชัดเจน
- มี Visual (ถ้าทำได้)
- แนะนำ Action Items เฉพาะเจาะจง

**Output:**
📊 Summary → 🎯 Insights → 📈 Numbers → ✅ Actions',
'{"tools": ["kb_query", "sql_query", "data_analyzer", "chart_generator"], "permissions": ["read_strategy_kb", "query_database"]}',
'{"response_time_ms": 2500, "accuracy_threshold": 0.92, "insight_quality": 0.90}',
true,
'1.0.0'),

('marketing',
'คุณคือ Growth Hacker

**Logic:**
1. Query KB "marketing" → Writing Tone
2. ใช้เครื่องมือวิเคราะห์ SEO
3. อิง Metadata กลุ่มเป้าหมาย

**Style:**
- ทันสมัย ฉลาด
- Smart Lazy (ทำน้อย ได้มาก)
- Data-Driven

**Constraints:**
- ทุก Content สอดคล้อง Brand Voice
- ห้าม Clickbait หรือข้อมูลเท็จ
- ระบุ Target Audience ชัดเจน',
'{"tools": ["kb_query", "content_generator", "seo_analyzer", "hashtag_generator"], "permissions": ["read_marketing_kb", "create_content"]}',
'{"response_time_ms": 2000, "accuracy_threshold": 0.88, "engagement_score": 0.85}',
true,
'1.0.0');

-- ===============================================
-- 7. SAMPLE ERROR ANALYSIS (For Learning)
-- ===============================================

-- Prerequisite: Dummy User & Conversations for FK constraints
INSERT INTO users (id, email, name) VALUES 
('00000000-0000-0000-0000-000000000000', 'system_seed@ideas365.ai', 'System Seed')
ON CONFLICT (email) DO NOTHING;

INSERT INTO conversations (id, user_id, agent_type, status, title) VALUES
('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'design', 'completed', 'Seed Error Sample 1'),
('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'coder', 'completed', 'Seed Error Sample 2'),
('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'analyst', 'completed', 'Seed Error Sample 3')
ON CONFLICT (id) DO NOTHING;

-- ตัวอย่างความผิดพลาดที่เคยเกิด และบันทึกไว้เพื่อเรียนรู้
INSERT INTO error_analysis_logs 
(conversation_id, agent_type, issue_description, root_cause, suggested_fixes, user_decision, resolved) 
VALUES

('11111111-1111-1111-1111-111111111111', 'design',
'ดีไซน์ที่เสนอใช้สีที่ไม่ตรงกับ Brand',
'Agent ไม่ได้ Query Knowledge Base ก่อนเสนอสี',
'[
  {"fix": "บังคับให้ Query KB ทุกครั้ง", "impact": "high", "effort": "low"},
  {"fix": "Hard-code color palette ใน system prompt", "impact": "medium", "effort": "low"}
]',
'fix_1',
true),

('22222222-2222-2222-2222-222222222222', 'coder',
'โค้ดที่เขียนมี SQL Injection vulnerability',
'ลืมใช้ Prepared Statements',
'[
  {"fix": "เพิ่ม automated security scan", "impact": "high", "effort": "medium"},
  {"fix": "Update security checklist ใน KB", "impact": "high", "effort": "low"},
  {"fix": "Training เพิ่มเติมเรื่อง OWASP Top 10", "impact": "medium", "effort": "high"}
]',
'fix_2',
true),

('33333333-3333-3333-3333-333333333333', 'analyst',
'วิเคราะห์ข้อมูลผิด เพราะใช้ data ที่ outdated',
'ไม่ได้เช็ค timestamp ของข้อมูล',
'[
  {"fix": "เพิ่ม data freshness check", "impact": "high", "effort": "low"},
  {"fix": "แสดง data timestamp ในทุก report", "impact": "medium", "effort": "low"}
]',
'fix_1',
true);

-- ===============================================
-- 8. SAMPLE USER MEMORY
-- ===============================================

-- ตัวอย่างการเรียนรู้เกี่ยวกับ CEO (JYNE)
INSERT INTO user_memory (user_id, agent_type, preferences, learned_patterns, interaction_count) VALUES

('jyne_ceo', 'orchestrator',
'{"output_style": "concise", "tone": "professional_cool", "prefer_options": true, "max_explanation_lines": 5}',
'[
  {"pattern": "ชอบให้สรุปเป็น bullet points", "confidence": 0.95, "examples": 15},
  {"pattern": "ต้องการ action items ชัดเจน", "confidence": 0.92, "examples": 12},
  {"pattern": "ไม่ชอบคำอธิบายยาว", "confidence": 0.88, "examples": 10}
]',
25),

('jyne_ceo', 'design',
'{"prefer_minimal": true, "favorite_colors": ["blue", "green"], "avoid_colors": ["red", "pink"]}',
'[
  {"pattern": "ชอบดีไซน์แบบ Clean & Minimal", "confidence": 0.90, "examples": 8},
  {"pattern": "เน้น Functionality > Aesthetics", "confidence": 0.85, "examples": 6}
]',
8),

('jyne_ceo', 'coder',
'{"code_style": "clean_code", "prefer_typescript": true, "documentation_level": "medium"}',
'[
  {"pattern": "ต้องการ error handling ครบ", "confidence": 0.93, "examples": 10},
  {"pattern": "ชอบ TypeScript > JavaScript", "confidence": 0.88, "examples": 7}
]',
12);

-- ===============================================
-- END OF SEED DATA
-- ===============================================

-- Verify seed data
SELECT 'Knowledge Base entries:', COUNT(*) FROM knowledge_base;
SELECT 'Agent configurations:', COUNT(*) FROM agent_configs;
SELECT 'Error analysis logs:', COUNT(*) FROM error_analysis_logs;
SELECT 'User memory entries:', COUNT(*) FROM user_memory;
