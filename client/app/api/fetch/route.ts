import { Receiver } from '@upstash/qstash';
import { NextRequest, NextResponse } from 'next/server';
import { runNewsSync, type SyncWindow } from '@/app/lib/newsSync';

export const runtime = 'nodejs';

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
    console.error('GET /api/fetch failed', error);
    return NextResponse.json({ error: 'fetch failed' }, { status: 500 });
  }
}

async function verifyQStashRequest(req: NextRequest): Promise<boolean> {
  const signature = req.headers.get('upstash-signature');
  if (!signature) {
    return false;
  }

  const currentSigningKey = process.env.wn__QSTASH_CURRENT_SIGNING_KEY ?? process.env.QSTASH_CURRENT_SIGNING_KEY;
  const nextSigningKey = process.env.wn__QSTASH_NEXT_SIGNING_KEY ?? process.env.QSTASH_NEXT_SIGNING_KEY;

  const receiver = new Receiver({
    currentSigningKey,
    nextSigningKey,
  });

  try {
    const body = await req.clone().text();
    return await receiver.verify({
      signature,
      body,
      url: req.url,
      upstashRegion: req.headers.get('upstash-region') ?? undefined,
    });
  } catch (error) {
    console.error('QStash signature verification failed', error);
    return false;
  }
}

export async function POST(req: NextRequest) {
  const isValid = await verifyQStashRequest(req);
  if (!isValid) {
    return NextResponse.json({ error: 'invalid qstash signature' }, { status: 401 });
  }

  return handleSchedulerRequest(req);
}

export async function GET(req: Request) {
  return handleSchedulerRequest(req);
}

