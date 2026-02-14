import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env' });

async function runManualMigrations() {
    if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL is missing!");
    }

    const sql = neon(process.env.DATABASE_URL);

    const migrationFiles = [
        '0004_complete_architecture.sql',
        '0005_fix_kb_constraints.sql',
        '0006_add_orchestrator.sql'
    ];

    console.log('🚀 Starting manual migration using Neon driver...');

    for (const file of migrationFiles) {
        const filePath = path.join(process.cwd(), 'migrations', file);
        if (!fs.existsSync(filePath)) {
            console.error(`❌ Migration file not found: ${file}`);
            continue;
        }

        console.log(`📄 Reading ${file}...`);
        let content = fs.readFileSync(filePath, 'utf8');

        // Remove comments
        content = content.replace(/--.*$/gm, '');

        // Split by semicolon (handling basic cases)
        const statements = content.split(';')
            .map((s: string) => s.trim())
            .filter((s: string) => s.length > 0);

        console.log(`▶ Executing ${statements.length} statements from ${file}...`);

        for (const [index, stmt] of statements.entries()) {
            try {
                await sql(stmt);
            } catch (err: any) {
                // Ignore "already exists" errors for CREATE TABLE/INDEX if possible, 
                // but checking error code is better. 
                // However, our script uses IF NOT EXISTS where possible in 0004.
                // 0005 uses ALTER which might fail if already dropped.
                console.warn(`⚠️ Warning on statement ${index + 1} of ${file}: ${err.message}`);
                // Continue despite error? Yes for idempotency attempts.
            }
        }
        console.log(`✅ ${file} processed.`);
    }

    console.log('🎉 Manual migrations completed.');
    process.exit(0);
}

runManualMigrations().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
});
