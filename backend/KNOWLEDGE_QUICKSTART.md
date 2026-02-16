# 🚀 Knowledge Base Quick Start

**3-minute guide to adding knowledge to your AI agents**

---

## 📊 Data Structure (Quick Reference)

```
knowledge_base
├── agent_type     (design | analyst | coder | marketing | orchestrator)
├── source_type    (manual | google_sheets | api | file_upload)
├── category       (brand_voice | techniques | best_practices)
├── key            (Topic title)
├── value          (Content text)
├── metadata       (JSON: {"priority": "high"})
└── is_active      (true/false)
```

---

## ⚡ Quick Add (SQL)

### **1-Line Insert:**

```sql
INSERT INTO knowledge_base (agent_type, source_type, category, key, value, metadata, is_active)
VALUES ('design', 'manual', 'brand_voice', 'iDEAS365 Tone', 'Be energetic and inspiring!', '{"priority": "high"}'::jsonb, true);
```

### **Bulk Insert:**

```sql
INSERT INTO knowledge_base (agent_type, source_type, category, key, value, metadata, is_active)
VALUES
  ('design', 'manual', 'brand_voice', 'Tone - Creative', 'Use energetic language...', '{"priority": "high"}'::jsonb, true),
  ('coder', 'manual', 'best_practices', 'Clean Code', 'Meaningful names, small functions...', '{}'::jsonb, true),
  ('analyst', 'manual', 'techniques', 'Data Viz', 'Choose right chart type...', '{}'::jsonb, true),
  ('marketing', 'manual', 'techniques', 'Growth Hacks', 'Viral loops, SEO content...', '{}'::jsonb, true);
```

---

## 📁 Use Templates

### **CSV → SQL:**

```bash
python3 scripts/import-knowledge-base.py knowledge-base-template.csv > import.sql
```

### **JSON → SQL:**

```bash
python3 scripts/import-json-knowledge.py knowledge-base-template.json > import.sql
```

### **Import to Neon:**

```bash
# Method 1: psql
psql $DATABASE_URL < import.sql

# Method 2: Neon Console
# Copy/paste import.sql into SQL Editor → Run
```

---

## 🎨 Agent Types

| Agent | DB Value | Use For |
|-------|----------|---------|
| Code Specialist | `coder` | Programming, tech |
| Creative Director | `design` | Design, visuals |
| Data Strategist | `analyst` | Analytics, data |
| Growth Hacker | `marketing` | Marketing, growth |
| Orchestrator | `orchestrator` | Coordination |

---

## 📂 Category Examples

- **`brand_voice`** - How to speak, tone, personality
- **`techniques`** - Specific methods, strategies
- **`best_practices`** - Standards, guidelines
- **`frameworks`** - Methodologies, processes
- **`examples`** - Real-world cases
- **`tools`** - Software, resources

---

## 🔍 Query Examples

### **View all entries:**

```sql
SELECT * FROM knowledge_base ORDER BY created_at DESC LIMIT 10;
```

### **By agent:**

```sql
SELECT * FROM knowledge_base WHERE agent_type = 'design';
```

### **By category:**

```sql
SELECT key, value FROM knowledge_base
WHERE agent_type = 'design' AND category = 'brand_voice';
```

### **Search:**

```sql
SELECT * FROM knowledge_base
WHERE key ILIKE '%tone%' OR value ILIKE '%tone%';
```

---

## ✏️ Update Entry

```sql
UPDATE knowledge_base
SET value = 'New content here...',
    metadata = '{"priority": "high", "updated": "2025-02-16"}'::jsonb,
    updated_at = NOW()
WHERE key = 'iDEAS365 Tone';
```

---

## 🗑️ Delete Entry

```sql
-- Soft delete (recommended)
UPDATE knowledge_base SET is_active = false WHERE key = 'Old Entry';

-- Hard delete
DELETE FROM knowledge_base WHERE key = 'Old Entry';
```

---

## 🎯 iDEAS365 Tone Templates

### **Design (Creative Director):**
```
"Let's create something extraordinary! 🎨
I'm excited to bring your vision to life with stunning design!"
```

### **Coder (Code Specialist):**
```
"Let's build this right! 💻
Here's a clean solution with best practices: [code]"
```

### **Analyst (Data Strategist):**
```
"Great insights here! 📊
The data shows 3 key opportunities: [findings]"
```

### **Marketing (Growth Hacker):**
```
"Let's scale this! 🚀
I see 3 strategies to 10x your growth: [tactics]"
```

---

## 🔧 Metadata Examples

```json
{
  "priority": "high",
  "language": "th-en",
  "difficulty": "intermediate",
  "time_estimate": "2-3 weeks",
  "tools": ["Figma", "Photoshop"],
  "tags": ["beginner-friendly", "quick-win"],
  "last_reviewed": "2025-02-16"
}
```

---

## 📞 Need Help?

- **Full guide:** `KNOWLEDGE_BASE_GUIDE.md`
- **Templates:** `knowledge-base-template.csv` / `.json`
- **API docs:** `GET /api/knowledge/add`

---

**⚡ Pro Tip:** Start with 5 brand_voice entries per agent to define personality!
