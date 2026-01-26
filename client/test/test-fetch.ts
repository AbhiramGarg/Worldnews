// test-fetch.ts

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';

// NOTE: If you have a centralized prisma client in lib/prisma.ts, you should import that instead.
const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function fetchAndDisplayArticles() {
  console.log('Attempting to fetch data from the database...');
  
  try {
    const articles = await prisma.newsArticle.findMany({
      select: {
        apiId: true,
        title: true,
        sourceCountry: true,
        publishDate: true,
      },
      orderBy: {
        publishDate: 'desc',
      },
      take: 5,
    });

    if (articles.length === 0) {
      console.log('✅ Success! The connection works, but no articles were found.');
      return;
    }

    console.log(`\n✅ Success! Fetched ${articles.length} articles:`);
    console.table(articles);

  } catch (error) {
    console.error('❌ Error fetching data. Check server logs or connection string:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fetchAndDisplayArticles();