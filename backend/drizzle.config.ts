
import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

export default defineConfig({
    schema: './drizzle/schema.ts',
    out: './migrations',
    dialect: 'postgresql', // Drizzle v0.21+ uses 'dialect' instead of 'driver'
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
    verbose: true,
    strict: true,
});
