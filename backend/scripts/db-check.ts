import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../drizzle/schema';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
    const sql = neon(process.env.DATABASE_URL!);
    const db = drizzle(sql);

    console.log('--- Database Status Check ---');

    try {
        const userCount = await db.select().from(schema.users);
        console.log(`Users: ${userCount.length}`);

        const memoryCount = await db.select().from(schema.userMemory);
        console.log(`Agent Memory: ${memoryCount.length}`);

        const kbCount = await db.select().from(schema.knowledgeBase);
        console.log(`Knowledge Base: ${kbCount.length}`);

        const conversationCount = await db.select().from(schema.conversations);
        console.log(`Conversations: ${conversationCount.length}`);

        const messageCount = await db.select().from(schema.messages);
        console.log(`Messages: ${messageCount.length}`);

        const configCount = await db.select().from(schema.agentConfigs);
        console.log(`Agent Configs: ${configCount.length}`);

        if (memoryCount.length > 0) {
            console.log('\n--- Sample Memory ---');
            console.log(JSON.stringify(memoryCount[0], null, 2));
        }

    } catch (error) {
        console.error('Error checking database:', error);
    }
}

main();
