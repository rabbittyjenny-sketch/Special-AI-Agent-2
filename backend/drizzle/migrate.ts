
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

async function runMigrations() {
    if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL is missing!");
    }

    const sql = neon(process.env.DATABASE_URL!);
    const db = drizzle(sql);

    console.log('⏳ Running migrations...');

    // This will read the SQL files in your 'migrations' folder and apply them
    await migrate(db, { migrationsFolder: './migrations' });

    console.log('✅ Migrations completed successfully!');
    process.exit(0);
}

runMigrations().catch((err) => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
});
