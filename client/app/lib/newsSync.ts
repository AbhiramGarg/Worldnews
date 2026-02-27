import { ApiArticleSchema } from '@/lib/Validation';
import {
  connectToDatabase,
  deleteAndInsertNewsArticles,
  insertNewsArticles,
  replaceNewsArticlesForCountries,
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

export type MissingCountriesReport = {
  window: SyncWindow;
  targetCountries: string[];
  existingCountries: string[];
  missingCountries: string[];
};

export type RetryMissingCountriesResult = {
  window: SyncWindow;
  targetCountries: string[];
  existingCountriesBefore: string[];
  missingCountriesBefore: string[];
  retried: boolean;
  retryResult?: {
    count: number;
    saved: number;
    dbMode: string;
    countries: string[];
  };
  existingCountriesAfter: string[];
  missingCountriesAfter: string[];
};

function getCountries(window: SyncWindow): string[] {
  return window === 'earlybirds' ? earlybirds : latecomers;
}

export function getCountriesForWindow(window: SyncWindow): string[] {
  return [...getCountries(window)];
}

async function getExistingCountriesFromDatabase(countries: string[]): Promise<string[]> {
  if (countries.length === 0) {
    return [];
  }

  const prisma = await connectToDatabase();
  try {
    const rows = await prisma.newsArticle.findMany({
      where: {
        sourceCountry: {
          in: countries,
        },
      },
      select: {
        sourceCountry: true,
      },
      distinct: ['sourceCountry'],
    });

    return rows
      .map((row) => String(row.sourceCountry).toLowerCase().trim())
      .filter(Boolean);
  } finally {
    await prisma.$disconnect();
  }
}

export async function getMissingCountriesReport(
  window: SyncWindow,
  countriesOverride?: string[],
): Promise<MissingCountriesReport> {
  const targetCountries = (countriesOverride && countriesOverride.length > 0
    ? countriesOverride
    : getCountries(window)
  )
    .map((country) => String(country).toLowerCase().trim())
    .filter(Boolean);

  const existingCountries = await getExistingCountriesFromDatabase(targetCountries);
  const existingSet = new Set(existingCountries);
  const missingCountries = targetCountries.filter((country) => !existingSet.has(country));

  return {
    window,
    targetCountries,
    existingCountries,
    missingCountries,
  };
}

export async function retryMissingCountries(window: SyncWindow, countriesOverride?: string[]): Promise<RetryMissingCountriesResult> {
  const before = await getMissingCountriesReport(window, countriesOverride);

  if (before.missingCountries.length === 0) {
    return {
      window,
      targetCountries: before.targetCountries,
      existingCountriesBefore: before.existingCountries,
      missingCountriesBefore: [],
      retried: false,
      existingCountriesAfter: before.existingCountries,
      missingCountriesAfter: [],
    };
  }

  const retryResult = await runNewsSync(window, {
    countries: before.missingCountries,
    replaceCountries: true,
    resetBeforeInsert: false,
  });

  const after = await getMissingCountriesReport(window, before.targetCountries);

  return {
    window,
    targetCountries: before.targetCountries,
    existingCountriesBefore: before.existingCountries,
    missingCountriesBefore: before.missingCountries,
    retried: true,
    retryResult: {
      count: retryResult.count,
      saved: retryResult.saved,
      dbMode: retryResult.dbMode,
      countries: retryResult.countries,
    },
    existingCountriesAfter: after.existingCountries,
    missingCountriesAfter: after.missingCountries,
  };
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  if (parsed <= 0) return fallback;
  return Math.floor(parsed);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRetryAfterMs(response: Response): number | null {
  const retryAfterRaw = response.headers.get('retry-after');
  if (!retryAfterRaw) {
    return null;
  }

  const seconds = Number(retryAfterRaw);
  if (Number.isFinite(seconds)) {
    return Math.max(0, Math.floor(seconds * 1000));
  }

  const retryAt = Date.parse(retryAfterRaw);
  if (!Number.isNaN(retryAt)) {
    return Math.max(0, retryAt - Date.now());
  }

  return null;
}

const COUNTRY_REQUEST_DELAY_MS = parsePositiveInt(process.env.SYNC_COUNTRY_DELAY_MS, 1000);
const MAX_429_RETRIES = parsePositiveInt(process.env.SYNC_MAX_429_RETRIES, 3);
const RETRY_BACKOFF_BASE_MS = parsePositiveInt(process.env.SYNC_429_BACKOFF_BASE_MS, 3000);
const RETRY_BACKOFF_MAX_MS = parsePositiveInt(process.env.SYNC_429_BACKOFF_MAX_MS, 45000);

async function fetchNewsForCountries(countries: string[], apiKey: string) {
  const allNews: any[] = [];
  const categoriesParam = categories.join(',');

  for (const country of countries) {
    const url = `${baseurl}?language=[en]&number=5&source-countries=${country}&categories=${categoriesParam}`;
    let attempt = 0;

    while (attempt <= MAX_429_RETRIES) {
      try {
        console.log(`[sync:${country}] Fetching (attempt ${attempt + 1}/${MAX_429_RETRIES + 1})...`);
        const response = await fetch(url, {
          headers: {
            'X-API-Key': apiKey,
          },
        });

        if (!response.ok) {
          const responseBody = (await response.text().catch(() => '')).slice(0, 200);

          if (response.status === 429 && attempt < MAX_429_RETRIES) {
            const retryAfterMs = getRetryAfterMs(response);
            const exponentialBackoffMs = Math.min(
              RETRY_BACKOFF_BASE_MS * (2 ** attempt),
              RETRY_BACKOFF_MAX_MS,
            );
            const jitterMs = Math.floor(Math.random() * 500);
            const waitMs = Math.max(retryAfterMs ?? 0, exponentialBackoffMs + jitterMs);

            console.warn(
              `[sync:${country}] 429 rate-limited. Retrying in ${waitMs}ms (attempt ${attempt + 1}/${MAX_429_RETRIES}).`
            );

            attempt += 1;
            await sleep(waitMs);
            continue;
          }

          console.error(`[sync:${country}] Failed: ${response.status}${responseBody ? ` - ${responseBody}` : ''}`);
          break;
        }

        const data = await response.json();
        if (!data.news || data.news.length === 0) {
          break;
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
          break;
        }

        allNews.push(...sanitizedArticles);
        console.log(`[sync:${country}] Validation: ${sanitizedArticles.length}/${fetchedCount}`);
        break;
      } catch (error) {
        console.error(`[sync:${country}] Error fetching:`, error);
        break;
      }
    }

    await sleep(COUNTRY_REQUEST_DELAY_MS);
  }

  return allNews;
}

type RunNewsSyncOptions = {
  countries?: string[];
  resetBeforeInsert?: boolean;
  replaceCountries?: boolean;
};

export async function runNewsSync(window: SyncWindow, options: RunNewsSyncOptions = {}) {
  console.log(`[sync:${window}] Starting news sync`);

  const apiKey = process.env.WORLD_NEWS_API_KEY;
  if (!apiKey) {
    throw new Error('WORLD_NEWS_API_KEY is not set');
  }

  const countries = options.countries && options.countries.length > 0
    ? options.countries
    : getCountries(window);
  const allNews = await fetchNewsForCountries(countries, apiKey);

  let savedCount = 0;
  const shouldReplaceCountries = options.replaceCountries === true;
  const shouldReset = options.resetBeforeInsert ?? window === 'earlybirds';
  let dbMode: 'delete-and-insert' | 'insert-only' | 'replace-countries' = shouldReplaceCountries
    ? 'replace-countries'
    : shouldReset
      ? 'delete-and-insert'
      : 'insert-only';

  try {
    const prisma = await connectToDatabase();
    try {
      if (shouldReplaceCountries) {
        dbMode = 'replace-countries';
        savedCount = await replaceNewsArticlesForCountries(prisma, countries, allNews);
      } else if (shouldReset) {
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
