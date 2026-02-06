import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

async function seed() {
    if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL is missing!");
    }

    const sql = neon(process.env.DATABASE_URL);

    console.log('Seeding agent configs...');

    // Check if data already exists
    const existing = await sql`SELECT COUNT(*) as count FROM agent_configs`;
    if (Number(existing[0].count) > 0) {
        console.log('Agent configs already seeded, skipping...');
    } else {
        await sql`INSERT INTO agent_configs (agent_type, system_prompt, available_tools, metadata) VALUES
            ('design',
            'You are an expert design assistant specialized in UI/UX, visual design, and branding. You have access to design principles, color theory, typography guidelines, and can generate mockups. Always consider accessibility, modern design trends, and brand consistency in your recommendations.',
            '[{"name": "getDesignPrinciples", "enabled": true}, {"name": "getColorPalettes", "enabled": true}, {"name": "getBrandGuidelines", "enabled": true}, {"name": "generateMockup", "enabled": true}, {"name": "analyzeBranding", "enabled": true}]'::jsonb,
            '{"specializations": ["UI/UX", "branding", "typography", "color theory"]}'::jsonb),
            ('analyst',
            'You are a data analyst assistant expert in statistical analysis, data visualization, and insights generation. You can query databases, perform calculations, generate charts, and provide actionable recommendations. Always cite your data sources and explain your analytical methodology.',
            '[{"name": "queryGoogleSheets", "enabled": true}, {"name": "runSQLQuery", "enabled": true}, {"name": "statisticalAnalysis", "enabled": true}, {"name": "generateChart", "enabled": true}, {"name": "findCorrelations", "enabled": true}]'::jsonb,
            '{"specializations": ["statistics", "data visualization", "predictive analytics"]}'::jsonb),
            ('coder',
            'You are a senior software engineer assistant proficient in multiple programming languages and frameworks. You can write, review, debug code, and provide best practices. You have access to code templates and can execute code safely. Always prioritize code quality, security, and maintainability.',
            '[{"name": "searchGitHub", "enabled": true}, {"name": "getCodeTemplates", "enabled": true}, {"name": "executeCode", "enabled": true}, {"name": "lintCode", "enabled": true}, {"name": "getBestPractices", "enabled": true}]'::jsonb,
            '{"specializations": ["JavaScript", "Python", "TypeScript", "React", "Node.js"]}'::jsonb),
            ('marketing',
            'You are a digital marketing strategist specialized in content creation, campaign optimization, and social media. You understand platform algorithms, audience targeting, and conversion optimization. Always consider brand voice, target audience, and marketing goals in your recommendations.',
            '[{"name": "analyzeContent", "enabled": true}, {"name": "getSEOScore", "enabled": true}, {"name": "generateHashtags", "enabled": true}, {"name": "getContentTemplates", "enabled": true}, {"name": "getCampaignMetrics", "enabled": true}]'::jsonb,
            '{"specializations": ["content marketing", "SEO", "social media", "email marketing"]}'::jsonb)`;
        console.log('Agent configs seeded.');
    }

    console.log('Seeding knowledge base...');

    const kbExisting = await sql`SELECT COUNT(*) as count FROM knowledge_base`;
    if (Number(kbExisting[0].count) > 0) {
        console.log('Knowledge base already seeded, skipping...');
    } else {
        // Design knowledge
        await sql`INSERT INTO knowledge_base (agent_type, source_type, category, key, value, metadata) VALUES
            ('design', 'manual', 'design_principles', 'color_theory_basics',
            'Primary colors: Red, Blue, Yellow. Secondary colors are created by mixing primaries. Complementary colors sit opposite on the color wheel and create high contrast. Analogous colors sit next to each other and create harmony.',
            '{"tags": ["color", "basics"], "difficulty": "beginner"}'::jsonb),
            ('design', 'manual', 'design_principles', 'typography_hierarchy',
            'Use 2-3 font families maximum. Establish clear hierarchy with size, weight, and spacing. Headings should be 1.5-2x body text size. Line height should be 1.5-1.6 for readability. Maintain consistent spacing between elements (8px grid system recommended).',
            '{"tags": ["typography", "hierarchy"], "difficulty": "intermediate"}'::jsonb)`;

        // Analyst knowledge
        await sql`INSERT INTO knowledge_base (agent_type, source_type, category, key, value, metadata) VALUES
            ('analyst', 'manual', 'statistical_methods', 'correlation_analysis',
            'Correlation measures relationship strength between variables (-1 to +1). Pearson: Linear relationships, normally distributed data. Spearman: Non-linear relationships, ordinal data. Correlation does not equal causation. Always consider confounding variables.',
            '{"tags": ["statistics", "correlation"], "difficulty": "intermediate"}'::jsonb)`;

        // Coder knowledge
        await sql`INSERT INTO knowledge_base (agent_type, source_type, category, key, value, metadata) VALUES
            ('coder', 'manual', 'code_templates', 'react_component_functional',
            ${'import React from "react";\n\ninterface Props {\n  title: string;\n  children: React.ReactNode;\n}\n\nexport const Component: React.FC<Props> = ({ title, children }) => {\n  return (\n    <div>\n      <h2>{title}</h2>\n      {children}\n    </div>\n  );\n};'},
            '{"tags": ["react", "typescript", "component"], "framework": "react", "language": "typescript"}'::jsonb),
            ('coder', 'manual', 'best_practices', 'error_handling_nodejs',
            'Always use try-catch for async operations. Create custom error classes for better error handling. Use proper HTTP status codes. Log errors with context (user ID, request ID, timestamp). Never expose internal error details to clients in production.',
            '{"tags": ["nodejs", "error-handling", "best-practices"], "language": "javascript"}'::jsonb)`;

        // Marketing knowledge
        await sql`INSERT INTO knowledge_base (agent_type, source_type, category, key, value, metadata) VALUES
            ('marketing', 'manual', 'content_templates', 'instagram_post_template',
            '[Hook - First line must grab attention]\n[Problem - Identify pain point]\n[Solution - Your product/service]\n[Social Proof - Testimonial/stats]\n[CTA - Clear next step]\n\nOptimal length: 125-150 words\nHashtags: 5-10 relevant tags\nInclude emoji for visual breaks',
            '{"tags": ["instagram", "social-media", "template"], "platform": "instagram", "content_type": "post"}'::jsonb)`;

        console.log('Knowledge base seeded.');
    }

    console.log('Seed completed successfully!');
    process.exit(0);
}

seed().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});
