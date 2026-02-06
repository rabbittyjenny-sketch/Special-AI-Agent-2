-- Migration: Seed Initial Data
-- Created: 2025-02-05
-- Description: Default agent configs and sample knowledge base

BEGIN;

-- ============================================
-- AGENT CONFIGURATIONS
-- ============================================

INSERT INTO agent_configs (agent_type, system_prompt, available_tools, metadata) VALUES

-- Design Agent
('design', 
'You are an expert design assistant specialized in UI/UX, visual design, and branding. 
You have access to design principles, color theory, typography guidelines, and can generate mockups.
Always consider accessibility, modern design trends, and brand consistency in your recommendations.',
'[
  {"name": "getDesignPrinciples", "enabled": true},
  {"name": "getColorPalettes", "enabled": true},
  {"name": "getBrandGuidelines", "enabled": true},
  {"name": "generateMockup", "enabled": true},
  {"name": "analyzeBranding", "enabled": true}
]'::jsonb,
'{"specializations": ["UI/UX", "branding", "typography", "color theory"]}'::jsonb),

-- Analyst Agent
('analyst',
'You are a data analyst assistant expert in statistical analysis, data visualization, and insights generation.
You can query databases, perform calculations, generate charts, and provide actionable recommendations.
Always cite your data sources and explain your analytical methodology.',
'[
  {"name": "queryGoogleSheets", "enabled": true},
  {"name": "runSQLQuery", "enabled": true},
  {"name": "statisticalAnalysis", "enabled": true},
  {"name": "generateChart", "enabled": true},
  {"name": "findCorrelations", "enabled": true}
]'::jsonb,
'{"specializations": ["statistics", "data visualization", "predictive analytics"]}'::jsonb),

-- Coder Agent
('coder',
'You are a senior software engineer assistant proficient in multiple programming languages and frameworks.
You can write, review, debug code, and provide best practices. You have access to code templates and can execute code safely.
Always prioritize code quality, security, and maintainability.',
'[
  {"name": "searchGitHub", "enabled": true},
  {"name": "getCodeTemplates", "enabled": true},
  {"name": "executeCode", "enabled": true},
  {"name": "lintCode", "enabled": true},
  {"name": "getBestPractices", "enabled": true}
]'::jsonb,
'{"specializations": ["JavaScript", "Python", "TypeScript", "React", "Node.js"]}'::jsonb),

-- Marketing Agent
('marketing',
'You are a digital marketing strategist specialized in content creation, campaign optimization, and social media.
You understand platform algorithms, audience targeting, and conversion optimization.
Always consider brand voice, target audience, and marketing goals in your recommendations.',
'[
  {"name": "analyzeContent", "enabled": true},
  {"name": "getSEOScore", "enabled": true},
  {"name": "generateHashtags", "enabled": true},
  {"name": "getContentTemplates", "enabled": true},
  {"name": "getCampaignMetrics", "enabled": true}
]'::jsonb,
'{"specializations": ["content marketing", "SEO", "social media", "email marketing"]}'::jsonb);

-- ============================================
-- SAMPLE KNOWLEDGE BASE
-- ============================================

-- Design Knowledge
INSERT INTO knowledge_base (agent_type, source_type, category, key, value, metadata) VALUES

('design', 'manual', 'design_principles', 'color_theory_basics',
'Primary colors: Red, Blue, Yellow. Secondary colors are created by mixing primaries. 
Complementary colors sit opposite on the color wheel and create high contrast. 
Analogous colors sit next to each other and create harmony.',
'{"tags": ["color", "basics"], "difficulty": "beginner"}'::jsonb),

('design', 'manual', 'design_principles', 'typography_hierarchy',
'Use 2-3 font families maximum. Establish clear hierarchy with size, weight, and spacing.
Headings should be 1.5-2x body text size. Line height should be 1.5-1.6 for readability.
Maintain consistent spacing between elements (8px grid system recommended).',
'{"tags": ["typography", "hierarchy"], "difficulty": "intermediate"}'::jsonb),

-- Analyst Knowledge
('analyst', 'manual', 'statistical_methods', 'correlation_analysis',
'Correlation measures relationship strength between variables (-1 to +1).
Pearson: Linear relationships, normally distributed data.
Spearman: Non-linear relationships, ordinal data.
Correlation ≠ causation. Always consider confounding variables.',
'{"tags": ["statistics", "correlation"], "difficulty": "intermediate"}'::jsonb),

-- Coder Knowledge
('coder', 'manual', 'code_templates', 'react_component_functional',
'import React from ''react'';

interface Props {
  title: string;
  children: React.ReactNode;
}

export const Component: React.FC<Props> = ({ title, children }) => {
  return (
    <div>
      <h2>{title}</h2>
      {children}
    </div>
  );
};',
'{"tags": ["react", "typescript", "component"], "framework": "react", "language": "typescript"}'::jsonb),

('coder', 'manual', 'best_practices', 'error_handling_nodejs',
'Always use try-catch for async operations. Create custom error classes for better error handling.
Use proper HTTP status codes. Log errors with context (user ID, request ID, timestamp).
Never expose internal error details to clients in production.',
'{"tags": ["nodejs", "error-handling", "best-practices"], "language": "javascript"}'::jsonb),

-- Marketing Knowledge
('marketing', 'manual', 'content_templates', 'instagram_post_template',
'[Hook - First line must grab attention]
[Problem - Identify pain point]
[Solution - Your product/service]
[Social Proof - Testimonial/stats]
[CTA - Clear next step]

Optimal length: 125-150 words
Hashtags: 5-10 relevant tags
Include emoji for visual breaks',
'{"tags": ["instagram", "social-media", "template"], "platform": "instagram", "content_type": "post"}'::jsonb);

COMMIT;
