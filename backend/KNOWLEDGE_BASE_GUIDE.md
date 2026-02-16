# 📚 Knowledge Base Management Guide

Complete guide to adding domain-specific knowledge and brand personality to your AI agents.

---

## 🎯 What is the Knowledge Base?

The Knowledge Base allows you to:
- ✅ Add **domain-specific expertise** to each agent
- ✅ Define **brand voice and tone** (iDEAS365 personality)
- ✅ Store **best practices and techniques**
- ✅ Create **reusable knowledge** across conversations

---

## 🏗️ Database Structure

### Table: `knowledge_base`

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `id` | UUID | Auto-generated | `a1b2c3d4-...` |
| **`agent_type`** | Enum | Which agent? | `design`, `analyst`, `coder`, `marketing`, `orchestrator` |
| **`source_type`** | String | Data source | `manual`, `google_sheets`, `api`, `file_upload` |
| **`category`** | String | Category | `brand_voice`, `techniques`, `best_practices` |
| **`key`** | String | Title/Topic | `"Visual Hierarchy Principles"` |
| **`value`** | Text | Content | `"1. Size matters - larger = more important..."` |
| `metadata` | JSON | Extra data | `{"priority": "high", "language": "th"}` |
| `is_active` | Boolean | Enabled? | `true` |
| `synced_at` | Timestamp | Last sync | `2025-02-16T10:00:00Z` |

---

## 🎨 Agent Mapping

| UI Name | Database Value | Color | Description |
|---------|----------------|-------|-------------|
| **Code Specialist** | `coder` | 🔵 Blue | Technical expertise, clean code |
| **Creative Director** | `design` | 🔴 Red | Design thinking, visual creativity |
| **Data Strategist** | `analyst` | 🟡 Yellow | Data analysis, insights |
| **Growth Hacker** | `marketing` | 🟢 Green | Growth strategies, marketing |
| **Orchestrator** | `orchestrator` | ⚪ Metallic | Multi-agent coordination |

---

## 📊 Recommended Data Structure

### 1️⃣ **Knowledge** (General expertise)
- **Category:** `knowledge` or `best_practices`
- **Purpose:** Foundational knowledge, frameworks
- **Examples:**
  - Design: "Color Theory Fundamentals"
  - Coder: "SOLID Principles"
  - Analyst: "Statistical Methods"
  - Marketing: "SEO Basics"

### 2️⃣ **Techniques** (Specific methods)
- **Category:** `techniques` or `advanced_techniques`
- **Purpose:** How-to guides, strategies
- **Examples:**
  - Design: "Visual Hierarchy Techniques"
  - Coder: "Error Handling Patterns"
  - Analyst: "A/B Testing Framework"
  - Marketing: "Growth Hacking Playbook"

### 3️⃣ **Brand Voice** (Personality & Tone)
- **Category:** `brand_voice` or `ideas365_tone`
- **Purpose:** Define how agents speak, respond style
- **Examples:**
  - "iDEAS365 Tone - Enthusiastic"
  - "Response Templates"
  - "Personality Guidelines"

---

## 🚀 3 Ways to Add Knowledge

### 📝 **Method 1: Manual Insert (Neon Console)**

**Steps:**
1. Go to: https://console.neon.tech/
2. Select your project
3. Click **SQL Editor**
4. Run SQL:

```sql
INSERT INTO knowledge_base (
  agent_type,
  source_type,
  category,
  key,
  value,
  metadata,
  is_active
) VALUES (
  'design',
  'manual',
  'brand_voice',
  'iDEAS365 Tone - Creative Director',
  'Use energetic and inspiring language. Focus on possibilities and creative solutions. Example: "Let''s make this amazing! 🎨"',
  '{"priority": "high", "language": "th-en"}'::jsonb,
  true
);
```

---

### 📊 **Method 2: Bulk Import (CSV)**

**Step 1: Edit CSV file**

File: `knowledge-base-template.csv`

```csv
agent_type,source_type,category,key,value,metadata,is_active
design,manual,brand_voice,iDEAS365 Tone,"Use energetic language...","{""priority"": ""high""}",true
```

**Step 2: Convert to SQL**

```bash
python3 scripts/import-knowledge-base.py knowledge-base-template.csv > import.sql
```

**Step 3: Run SQL in Neon**

```bash
psql $DATABASE_URL < import.sql
```

Or copy/paste into Neon Console SQL Editor.

---

### 📄 **Method 3: JSON Import**

**Step 1: Edit JSON file**

File: `knowledge-base-template.json`

```json
{
  "entries": [
    {
      "agentType": "design",
      "sourceType": "manual",
      "category": "brand_voice",
      "key": "iDEAS365 Tone - Creative",
      "value": "Use energetic and inspiring language...",
      "metadata": {
        "priority": "high",
        "language": "th-en"
      },
      "isActive": true
    }
  ]
}
```

**Step 2: Convert to SQL**

```bash
python3 scripts/import-json-knowledge.py knowledge-base-template.json > import.sql
```

**Step 3: Run SQL**

Same as CSV method above.

---

## 🔌 **Method 4: API Endpoint (Optional)**

### POST /api/knowledge/add

**Request:**

```bash
curl -X POST http://localhost:3000/api/knowledge/add \
  -H "Content-Type: application/json" \
  -d '{
    "agentType": "design",
    "sourceType": "manual",
    "category": "brand_voice",
    "key": "iDEAS365 Tone - Creative",
    "value": "Use energetic and inspiring language...",
    "metadata": {"priority": "high"},
    "isActive": true
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Knowledge base entry added successfully",
  "data": {
    "id": "a1b2c3d4-...",
    "agentType": "design",
    "key": "iDEAS365 Tone - Creative",
    ...
  }
}
```

---

## 💡 iDEAS365 Brand Voice Examples

### 🎨 **Creative Director (Design)**

```
"As iDEAS365's Creative Director, I speak with energy and inspiration! 🎨

My style:
- Use encouraging words: 'Let's create something amazing!'
- Focus on possibilities, not limitations
- Celebrate creativity and innovation
- Provide visual thinking and design insights

Example:
❌ 'I can help you with that design.'
✅ 'Let's bring your vision to life! I'm excited to help you create something extraordinary! 🌟'"
```

### 💻 **Code Specialist (Coder)**

```
"As iDEAS365's Code Specialist, I'm precise yet approachable! 💻

My style:
- Clear technical explanations
- Show code examples with context
- Mention best practices naturally
- Explain 'why' not just 'how'

Example:
❌ 'Use async/await here.'
✅ 'Let's use async/await here for better readability! It makes asynchronous code look synchronous: [code example]'"
```

### 📊 **Data Strategist (Analyst)**

```
"As iDEAS365's Data Strategist, I turn numbers into stories! 📊

My style:
- Lead with insights, not just data
- Use clear visualizations
- Explain trends and patterns
- Recommend actionable next steps

Example:
❌ 'The conversion rate is 2.5%.'
✅ 'Great news! Your conversion rate of 2.5% is above industry average. I see 3 opportunities to improve: [insights]'"
```

### 🚀 **Growth Hacker (Marketing)**

```
"As iDEAS365's Growth Hacker, I'm all about results! 🚀

My style:
- Focus on measurable outcomes
- Suggest creative experiments
- Data-driven but bold
- Quick wins + long-term strategy

Example:
❌ 'You should try email marketing.'
✅ 'Let's supercharge your growth! Here are 3 high-impact strategies that could 3x your reach in 60 days: [tactics]'"
```

---

## 📝 Content Guidelines

### ✅ **DO:**
- Use clear, actionable language
- Include examples and context
- Add metadata for filtering
- Organize by category
- Keep tone consistent with brand
- Use emojis sparingly (for emphasis)

### ❌ **DON'T:**
- Don't add duplicate entries
- Don't use vague language
- Don't include outdated info
- Don't forget metadata tags
- Don't overload with emojis

---

## 🔍 Query Knowledge Base

Agents automatically query their knowledge base during conversations.

**Programmatic query:**

```typescript
import { queryKnowledgeBase } from '@/lib/agent/knowledge-manager';

const entries = await queryKnowledgeBase('design', {
  category: 'brand_voice',
  limit: 5
});
```

---

## 📁 File Structure

```
backend/
├── knowledge-base-template.csv         # CSV template
├── knowledge-base-template.json        # JSON template
├── scripts/
│   ├── import-knowledge-base.py       # CSV → SQL converter
│   └── import-json-knowledge.py       # JSON → SQL converter
├── app/api/knowledge/add/
│   └── route.ts                       # API endpoint
└── KNOWLEDGE_BASE_GUIDE.md           # This file!
```

---

## 🎓 Quick Start Workflow

### **For First-Time Setup:**

1. **Edit template:**
   ```bash
   # Choose CSV or JSON
   code knowledge-base-template.csv
   # OR
   code knowledge-base-template.json
   ```

2. **Convert to SQL:**
   ```bash
   # CSV:
   python3 scripts/import-knowledge-base.py knowledge-base-template.csv > import.sql

   # JSON:
   python3 scripts/import-json-knowledge.py knowledge-base-template.json > import.sql
   ```

3. **Import to Neon:**
   - Go to: https://console.neon.tech/
   - Open SQL Editor
   - Copy/paste from `import.sql`
   - Click **Run**

4. **Verify:**
   ```sql
   SELECT COUNT(*) FROM knowledge_base;
   SELECT * FROM knowledge_base LIMIT 5;
   ```

---

## 🆘 Troubleshooting

### **Issue: SQL syntax error**
- Check for unescaped single quotes in text
- Use `''` (double single quote) to escape

### **Issue: Invalid JSON metadata**
- Validate JSON at https://jsonlint.com/
- Use `{}` for empty metadata

### **Issue: Knowledge not showing in responses**
- Check `is_active = true`
- Clear Redis cache: `redis.flushdb()`
- Verify agent_type matches

---

## 🎯 Best Practices

1. **Start Small** - Add 5-10 entries per category
2. **Test Impact** - See how agents respond
3. **Iterate** - Refine based on results
4. **Document** - Keep metadata updated
5. **Version Control** - Track changes in Git

---

## 📞 Support

Need help?
- Check existing entries: `SELECT * FROM knowledge_base WHERE agent_type = 'design';`
- View logs: Check Neon Console → Logs
- API docs: `GET /api/knowledge/add`

---

**Made with ❤️ by iDEAS365**
