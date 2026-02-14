import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env' });

async function seed() {
    if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL is missing!");
    }

    const sql = neon(process.env.DATABASE_URL);

    console.log('🌱 Starting seed process...');

    try {
        console.log('🧹 Cleaning existing data...');
        // Truncate tables to ensure clean slate
        await sql(`TRUNCATE TABLE knowledge_base, agent_configs, error_analysis_logs, user_memory RESTART IDENTITY CASCADE;`);

        const seedPath = path.join(process.cwd(), 'migrations', 'seed_data.sql');

        console.log(`📖 Reading seed file from: ${seedPath}`);

        if (!fs.existsSync(seedPath)) {
            throw new Error(`Seed file not found at ${seedPath}`);
        }

        let seedSql = fs.readFileSync(seedPath, 'utf8');

        // Remove comments
        seedSql = seedSql.replace(/--.*$/gm, '');

        // Split by semicolon
        const statements = seedSql.split(';')
            .map((s: string) => s.trim())
            .filter((s: string) => s.length > 0);

        console.log(`🚀 Found ${statements.length} statements to execute.`);

        for (const [index, statement] of statements.entries()) {
            console.log(`▶ Executing statement ${index + 1}/${statements.length}...`);
            try {
                // Execute statement
                await sql(statement);
            } catch (stmtError) {
                console.error(`❌ Failed on statement ${index + 1}:`, statement.substring(0, 100) + '...');
                throw stmtError;
            }
        }

        console.log('✅ Seed data injected successfully!');
    } catch (error) {
        console.error('❌ Error during seeding:', error);
        throw error; // Let the caller handle exit
    }
}

seed()
    .then(() => {
        console.log('Done.');
        process.exit(0);
    })
    .catch((err) => {
        console.error('Seed execution failed:', err);
        process.exit(1);
    });
