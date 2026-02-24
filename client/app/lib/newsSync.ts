import { ApiArticleSchema } from '@/lib/Validation';
import {
  connectToDatabase,
  deleteAndInsertNewsArticles,
  insertNewsArticles,
} from '@/db/postgres_db';

const baseurl = 'https://api.worldnewsapi.com/search-news';

const earlybirds = [
  'gb', 
  'fr', 'de', 'it', 'es', 'ru', 'cn', 'in', 'jp', 'kr',
  'au', 'za', 'eg', 'tr', 'sa', 'ir', 'il', 'ua', 'pk', 'id',
  'th', 'vn', 'ph', 'ng', 'et', 'ke', 'se', 'no', 'fi', 'pl',
  'nl', 'be', 'ch', 'at', 'cz', 'hu', 'gr', 'pt', 'ro', 'rs',
  'dk', 'ie',
];

const latecomers = ['us', 
  'ca', 'mx', 'br', 'ar', 'co', 'pe', 'cl'
  ];

const categories = ['business', 'entertainment', 'politics', 'sports', 'technology'];

export type SyncWindow = 'earlybirds' | 'latecomers';

function getCountries(window: SyncWindow): string[] {
  return window === 'earlybirds' ? earlybirds : latecomers;
}

async function fetchNewsForCountries(countries: string[], apiKey: string) {
  const allNews: any[] = [];
  const categoriesParam = categories.join(',');

  for (const country of countries) {
    const url = `${baseurl}?language=[en]&number=5&source-countries=${country}&categories=${categoriesParam}`;
    try {
      console.log(`[sync:${country}] Fetching...`);
      const response = await fetch(url, {
        headers: {
          'X-API-Key': apiKey,
        },
      });

      if (!response.ok) {
        console.error(`[sync:${country}] Failed: ${response.status}`);
        continue;
      }

      const data = await response.json();
      if (!data.news || data.news.length === 0) {
        continue;
      }

      const fetchedCount = data.news.length;
      const sanitizedArticles = data.news.flatMap((article: any) => {
        const parsed = ApiArticleSchema.safeParse({
          ...article,
          source_country: country,
        });

        if (!parsed.success) {
          console.warn('[sync] Skipping invalid article from API', parsed.error.issues);
          return [];
        }

        return [parsed.data];
      });

      if (sanitizedArticles.length === 0) {
        console.log(`[sync:${country}] Validation: 0/${fetchedCount}`);
        continue;
      }

      allNews.push(...sanitizedArticles);
      console.log(`[sync:${country}] Validation: ${sanitizedArticles.length}/${fetchedCount}`);
    } catch (error) {
      console.error(`[sync:${country}] Error fetching:`, error);
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return allNews;
}

export async function runNewsSync(window: SyncWindow) {
  console.log(`[sync:${window}] Starting news sync`);

  const apiKey = process.env.WORLD_NEWS_API_KEY;
  if (!apiKey) {
    throw new Error('WORLD_NEWS_API_KEY is not set');
  }

  const countries = getCountries(window);
  const allNews = await fetchNewsForCountries(countries, apiKey);

  let savedCount = 0;
  let dbMode: 'delete-and-insert' | 'insert-only' = 'insert-only';

  try {
    const prisma = await connectToDatabase();
    try {
      if (window === 'earlybirds') {
        dbMode = 'delete-and-insert';
        savedCount = await deleteAndInsertNewsArticles(prisma, allNews);
      } else {
        dbMode = 'insert-only';
        savedCount = await insertNewsArticles(prisma, allNews);
      }
    } finally {
      await prisma.$disconnect();
    }
  } catch (dbErr) {
    console.error(`[sync:${window}] Database save failed (continuing):`, dbErr);
  }

  return {
    window,
    count: allNews.length,
    saved: savedCount,
    dbMode,
    countries,
  };
}
