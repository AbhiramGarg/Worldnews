import { verifySignatureEdge } from '@upstash/qstash/nextjs';
import { NextResponse } from 'next/server';
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

async function handleSchedulerRequest(req: Request) {
  try {
    const url = new URL(req.url);

    const window = await resolveWindow(req, url);
    if (!window) {
      return NextResponse.json(
        { error: 'invalid window, expected earlybirds or latecomers' },
        { status: 400 }
      );
    }


    const result = await runNewsSync(window);

    return NextResponse.json({
      message: 'Data fetched',
      window: result.window,
      mode: result.dbMode,
      count: result.count,
      saved: result.saved,
      countries: result.countries,
    });
  } catch (error) {
    console.error('GET /api/fetch failed', error);
    return NextResponse.json({ error: 'fetch failed' }, { status: 500 });
  }
}

export const POST = verifySignatureEdge(handleSchedulerRequest)

export async function GET(req: Request) {
  return handleSchedulerRequest(req);
}

