import { ApiArticleSchema } from '@/lib/Validation';
import { Prisma, type PrismaClient } from '@prisma/client';
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
  countryOutcomes?: Record<string, string>;
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

type CountryOutcomeType =
  | 'success'
  | 'empty_response'
  | 'empty_after_validation'
  | 'http_error'
  | 'request_error'
  | 'rate_limited_exhausted'
  | 'db_save_failed';

type CountrySyncOutcome = {
  country: string;
  fetchedCount: number;
  sanitizedCount: number;
  attemptCount: number;
  outcome: CountryOutcomeType;
  httpStatus?: number;
  error?: string;
  articles: any[];
};

type CountrySyncStatusRow = {
  country: string;
  lastOutcome: string;
};

type PersistedCountrySyncOutcome = {
  country: string;
  fetchedCount: number;
  sanitizedCount: number;
  attemptCount: number;
  outcome: CountryOutcomeType;
  httpStatus: number | null;
  error: string | null;
};

function getCountries(window: SyncWindow): string[] {
  return window === 'earlybirds' ? earlybirds : latecomers;
}

function normalizeCountryCode(country: string): string {
  return String(country).toLowerCase().trim();
}

function normalizeCountries(countries: string[]): string[] {
  return countries
    .map((country) => normalizeCountryCode(country))
    .filter(Boolean);
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
          in: normalizeCountries(countries),
        },
      },
      select: {
        sourceCountry: true,
      },
      distinct: ['sourceCountry'],
    });

    return rows
      .map((row) => normalizeCountryCode(row.sourceCountry))
      .filter(Boolean);
  } finally {
    await prisma.$disconnect();
  }
}

function isCountrySyncStatusTableMissing(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return message.includes('country_sync_status') && message.includes('does not exist');
}

async function getCountrySyncOutcomes(
  window: SyncWindow,
  countries: string[]
): Promise<Map<string, string> | null> {
  const normalizedCountries = normalizeCountries(countries);
  if (normalizedCountries.length === 0) {
    return new Map();
  }

  const prisma = await connectToDatabase();
  try {
    const rows = await prisma.$queryRaw<CountrySyncStatusRow[]>`
      SELECT country, last_outcome AS "lastOutcome"
      FROM country_sync_status
      WHERE "window" = ${window}
        AND country IN (${Prisma.join(normalizedCountries)})
    `;

    const outcomeMap = new Map<string, string>();
    rows.forEach((row) => {
      outcomeMap.set(normalizeCountryCode(row.country), row.lastOutcome);
    });

    return outcomeMap;
  } catch (error) {
    if (isCountrySyncStatusTableMissing(error)) {
      return null;
    }

    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

function getCountriesNeedingRetryFromOutcomes(
  targetCountries: string[],
  outcomeMap: Map<string, string>
): string[] {
  return targetCountries.filter((country) => {
    const outcome = outcomeMap.get(country);
    return outcome !== 'success';
  });
}

export async function getMissingCountriesReport(
  window: SyncWindow,
  countriesOverride?: string[],
): Promise<MissingCountriesReport> {
  const targetCountries = normalizeCountries(countriesOverride && countriesOverride.length > 0
    ? countriesOverride
    : getCountries(window)
  );

  const existingCountries = await getExistingCountriesFromDatabase(targetCountries);
  const outcomeMap = await getCountrySyncOutcomes(window, targetCountries);

  if (outcomeMap === null) {
    const existingSet = new Set(existingCountries);
    const missingCountries = targetCountries.filter((country) => !existingSet.has(country));

    return {
      window,
      targetCountries,
      existingCountries,
      missingCountries,
    };
  }

  const missingCountries = getCountriesNeedingRetryFromOutcomes(targetCountries, outcomeMap);
  const countryOutcomes: Record<string, string> = {};
  targetCountries.forEach((country) => {
    countryOutcomes[country] = outcomeMap.get(country) ?? 'never_attempted';
  });

  return {
    window,
    targetCountries,
    existingCountries,
    missingCountries,
    countryOutcomes,
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

function createDefaultOutcome(country: string): CountrySyncOutcome {
  return {
    country,
    fetchedCount: 0,
    sanitizedCount: 0,
    attemptCount: 0,
    outcome: 'request_error',
    error: 'unknown error',
    articles: [],
  };
}

function compactError(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  return value.length > 500 ? value.slice(0, 500) : value;
}

type FetchNewsForCountriesResult = {
  allNews: any[];
  outcomes: CountrySyncOutcome[];
};

async function fetchNewsForCountries(countries: string[], apiKey: string) {
  const allNews: any[] = [];
  const outcomes: CountrySyncOutcome[] = [];
  const categoriesParam = categories.join(',');

  for (const country of countries) {
    const normalizedCountry = normalizeCountryCode(country);
    const url = `${baseurl}?language=[en]&number=5&source-countries=${normalizedCountry}&categories=${categoriesParam}`;
    let attempt = 0;
    const outcome = createDefaultOutcome(normalizedCountry);

    while (attempt <= MAX_429_RETRIES) {
      try {
        outcome.attemptCount = attempt + 1;
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

          if (response.status === 429) {
            outcome.outcome = 'rate_limited_exhausted';
          } else {
            outcome.outcome = 'http_error';
          }

          outcome.httpStatus = response.status;
          outcome.error = compactError(responseBody) ?? `http ${response.status}`;

          console.error(`[sync:${country}] Failed: ${response.status}${responseBody ? ` - ${responseBody}` : ''}`);
          break;
        }

        const data = await response.json();
        const fetchedNews = Array.isArray(data.news) ? data.news : [];
        outcome.fetchedCount = fetchedNews.length;

        if (!data.news || data.news.length === 0) {
          outcome.outcome = 'empty_response';
          outcome.error = undefined;
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

        outcome.sanitizedCount = sanitizedArticles.length;

        if (sanitizedArticles.length === 0) {
          outcome.outcome = 'empty_after_validation';
          outcome.error = 'all fetched articles failed validation';
          console.log(`[sync:${country}] Validation: 0/${fetchedCount}`);
          break;
        }

        outcome.outcome = 'success';
        outcome.error = undefined;
        outcome.articles = sanitizedArticles;
        allNews.push(...sanitizedArticles);
        console.log(`[sync:${country}] Validation: ${sanitizedArticles.length}/${fetchedCount}`);
        break;
      } catch (error) {
        outcome.outcome = 'request_error';
        outcome.error = error instanceof Error ? compactError(error.message) : 'unknown request error';
        console.error(`[sync:${country}] Error fetching:`, error);
        break;
      }
    }

    outcomes.push(outcome);

    await sleep(COUNTRY_REQUEST_DELAY_MS);
  }

  return {
    allNews,
    outcomes,
  } satisfies FetchNewsForCountriesResult;
}

type RunNewsSyncOptions = {
  countries?: string[];
  resetBeforeInsert?: boolean;
  replaceCountries?: boolean;
  runId?: string;
};

function withDbSaveOutcome(
  outcome: CountrySyncOutcome,
  dbSaveError: string | null
): PersistedCountrySyncOutcome {
  if (!dbSaveError || outcome.sanitizedCount === 0 || outcome.outcome !== 'success') {
    return {
      country: outcome.country,
      fetchedCount: outcome.fetchedCount,
      sanitizedCount: outcome.sanitizedCount,
      attemptCount: outcome.attemptCount,
      outcome: outcome.outcome,
      httpStatus: outcome.httpStatus ?? null,
      error: compactError(outcome.error) ?? null,
    };
  }

  return {
    country: outcome.country,
    fetchedCount: outcome.fetchedCount,
    sanitizedCount: outcome.sanitizedCount,
    attemptCount: outcome.attemptCount,
    outcome: 'db_save_failed',
    httpStatus: null,
    error: compactError(dbSaveError) ?? null,
  };
}

async function persistCountrySyncStatuses(
  prisma: PrismaClient,
  window: SyncWindow,
  runId: string,
  outcomes: PersistedCountrySyncOutcome[]
): Promise<void> {
  const now = new Date();

  for (const outcome of outcomes) {
    const successAt = outcome.outcome === 'success' ? now : null;

    await prisma.$executeRaw`
      INSERT INTO country_sync_status (
        "window",
        country,
        last_run_id,
        last_attempt_at,
        last_success_at,
        last_outcome,
        last_http_status,
        fetched_count,
        sanitized_count,
        attempt_count,
        last_error,
        created_at,
        updated_at
      )
      VALUES (
        ${window},
        ${outcome.country},
        ${runId},
        ${now},
        ${successAt},
        ${outcome.outcome},
        ${outcome.httpStatus},
        ${outcome.fetchedCount},
        ${outcome.sanitizedCount},
        ${outcome.attemptCount},
        ${outcome.error},
        ${now},
        ${now}
      )
      ON CONFLICT ("window", country)
      DO UPDATE SET
        last_run_id = EXCLUDED.last_run_id,
        last_attempt_at = EXCLUDED.last_attempt_at,
        last_success_at = CASE
          WHEN EXCLUDED.last_success_at IS NOT NULL THEN EXCLUDED.last_success_at
          ELSE country_sync_status.last_success_at
        END,
        last_outcome = EXCLUDED.last_outcome,
        last_http_status = EXCLUDED.last_http_status,
        fetched_count = EXCLUDED.fetched_count,
        sanitized_count = EXCLUDED.sanitized_count,
        attempt_count = EXCLUDED.attempt_count,
        last_error = EXCLUDED.last_error,
        updated_at = EXCLUDED.updated_at
    `;
  }
}

export async function runNewsSync(window: SyncWindow, options: RunNewsSyncOptions = {}) {
  console.log(`[sync:${window}] Starting news sync`);

  const apiKey = process.env.WORLD_NEWS_API_KEY;
  if (!apiKey) {
    throw new Error('WORLD_NEWS_API_KEY is not set');
  }

  const countries = options.countries && options.countries.length > 0
    ? normalizeCountries(options.countries)
    : normalizeCountries(getCountries(window));
  const runId = options.runId ?? `${window}:${new Date().toISOString()}`;
  const { allNews, outcomes } = await fetchNewsForCountries(countries, apiKey);

  let savedCount = 0;
  let dbSaveErrorMessage: string | null = null;
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
    dbSaveErrorMessage = dbErr instanceof Error ? dbErr.message : 'unknown database save error';
    console.error(`[sync:${window}] Database save failed (continuing):`, dbErr);
  }

  try {
    const prisma = await connectToDatabase();
    try {
      const persistedOutcomes = outcomes.map((outcome) => withDbSaveOutcome(outcome, dbSaveErrorMessage));
      await persistCountrySyncStatuses(prisma, window, runId, persistedOutcomes);
    } finally {
      await prisma.$disconnect();
    }
  } catch (statusErr) {
    if (isCountrySyncStatusTableMissing(statusErr)) {
      console.warn('[sync] country_sync_status table not found. Apply latest Prisma migration to enable status-based retries.');
    } else {
      console.error('[sync] Failed to persist country sync status:', statusErr);
    }
  }

  return {
    window,
    count: allNews.length,
    saved: savedCount,
    dbMode,
    countries,
  };
}
