// test/seed.mjs

// test/seed.mjs (First line)
import 'dotenv/config'; // or: require('dotenv').config();
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
// ... rest of the file ...-------------------------------------------------------
const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// 1. Diagnostics: Log the connection URL being used (masked for security)
const rawUrl = process.env.DATABASE_URL;
const loggedUrl = rawUrl ? rawUrl.replace(/:\/\/[^:]+:[^@]+@/, '://user:*****@') : 'URL NOT FOUND';
console.log(`[DIAGNOSTIC] Using DATABASE_URL: ${loggedUrl}`);
console.log('---');


const articleData = {
    id: 100000009, 
    title: "New Satellite Launched by NASA Reaches Orbit",
    text: "The successor satellite successfully reached orbit.",
    publish_date: "2025-11-23T12:00:00Z",
    source_country: "us",
    language: "en",
    authors: ["NASA Team"],
    summary: "NASA launch successful.",
    url: "https://nasa.gov/sat/9",
    image: null,
    video: null,
};


async function saveArticle(data) {
    console.log(`[PROCESS] Attempting to save article: ${data.title}`);
    
    // Ensure the optional fields are included in data
    const newArticle = await prisma.newsArticle.create({
        data: {
            apiId: BigInt(data.id), 
            title: data.title,
            text: data.text,
            publishDate: new Date(data.publish_date),
            sourceCountry: data.source_country,
            language: data.language,
            authors: data.authors,
            summary: data.summary,
            url: data.url,
            image: data.image,
            video: data.video,
        },
    });
    
    console.log(`[SUCCESS] Article saved with API ID: ${String(newArticle.apiId)}`);
    return newArticle;
}

// 4. Execution Block
async function main() {
    console.log('[START] Beginning seeding process...');
    // ⭐️ CONNECTION TEST ⭐️
    try {
        await prisma.$connect();
        console.log("✅ Database connection successful! Proceeding with data insertion.");
    } catch (e) {
        console.error("❌ ERROR: Failed to connect to PostgreSQL server.");
        console.error("   Please ensure PostgreSQL is running and your DATABASE_URL is correct.");
        throw e; // Throw the error to stop execution
    }
    
    // Only proceed if the connection test succeeded
    await saveArticle(articleData);
}

main()
  .catch((e) => {
    console.error('❌ Seeding process halted.', e.message || e);
    process.exit(1);
  })
  .finally(async () => {
    // Disconnect cleanly
    await prisma.$disconnect();
    console.log('[COMPLETE] Disconnected from database.');
  });