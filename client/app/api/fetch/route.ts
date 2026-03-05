import { NextResponse } from 'next/server';
import { runNewsSync, type SyncWindow } from '@/app/lib/newsSync';

export const runtime = 'nodejs';

function isAuthorized(req: Request): boolean {
  const configuredToken = process.env.CRON_SECRET;
  if (!configuredToken) return true;

  const authHeader = req.headers.get('authorization');
  if (!authHeader) return false;

  const expectedValue = `Bearer ${configuredToken}`;
  return authHeader === expectedValue;
}

function parseWindow(value: string | null): SyncWindow | null {
  if (value === null || value === 'earlybirds') return 'earlybirds';
  if (value === 'latecomers') return 'latecomers';
  return null;
}

async function resolveWindow(req: Request, url: URL): Promise<SyncWindow | null> {
  if (req.method !== 'POST') {
    return parseWindow(url.searchParams.get('window'));
  }

  const payload = await req
    .clone()
    .json()
    .catch(() => ({})) as { window?: string };

  const bodyWindow = typeof payload.window === 'string' ? payload.window : null;
  return parseWindow(bodyWindow ?? url.searchParams.get('window'));
}

type FetchPayload = {
  countries?: string[];
  resetBeforeInsert?: boolean;
  replaceCountries?: boolean;
  batchIndex?: number;
  totalBatches?: number;
};

async function resolvePayload(req: Request, url: URL): Promise<FetchPayload> {
  if (req.method !== 'POST') {
    const queryCountries = url.searchParams.get('countries');
    return {
      countries: queryCountries ? queryCountries.split(',').map((x) => x.trim()).filter(Boolean) : undefined,
      resetBeforeInsert: url.searchParams.get('resetBeforeInsert') === 'true',
      replaceCountries: url.searchParams.get('replaceCountries') === 'true',
      batchIndex: Number(url.searchParams.get('batchIndex') ?? '') || undefined,
      totalBatches: Number(url.searchParams.get('totalBatches') ?? '') || undefined,
    };
  }

  const payload = await req
    .clone()
    .json()
    .catch(() => ({})) as FetchPayload;

  return {
    countries: Array.isArray(payload.countries)
      ? payload.countries.map((x) => String(x).trim()).filter(Boolean)
      : undefined,
    resetBeforeInsert: payload.resetBeforeInsert === true,
    replaceCountries: payload.replaceCountries === true,
    batchIndex: typeof payload.batchIndex === 'number' ? payload.batchIndex : undefined,
    totalBatches: typeof payload.totalBatches === 'number' ? payload.totalBatches : undefined,
  };
}

async function handleSchedulerRequest(req: Request) {
  try {
    const url = new URL(req.url);
    if (!isAuthorized(req)) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const window = await resolveWindow(req, url);
    const payload = await resolvePayload(req, url);
    if (!window) {
      return NextResponse.json(
        { error: 'invalid window, expected earlybirds or latecomers' },
        { status: 400 }
      );
    }


    const result = await runNewsSync(window, {
      countries: payload.countries,
      resetBeforeInsert: payload.resetBeforeInsert,
      replaceCountries: payload.replaceCountries,
    });

    return NextResponse.json({
      message: 'Data fetched',
      window: result.window,
      mode: result.dbMode,
      count: result.count,
      saved: result.saved,
      countries: result.countries,
      batchIndex: payload.batchIndex,
      totalBatches: payload.totalBatches,
    });
  } catch (error) {
    console.error(`${req.method} /api/fetch failed`, error);
    return NextResponse.json({ error: 'fetch failed' }, { status: 500 });
  }
}
export async function POST(req: Request) {
  return handleSchedulerRequest(req);
}

export async function GET(req: Request) {
  return handleSchedulerRequest(req);
}

