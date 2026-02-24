import { NextResponse } from 'next/server';
import { runNewsSync, type SyncWindow } from '@/app/lib/newsSync';

export const runtime = 'nodejs';

function parseWindow(value: string | null): SyncWindow | null {
  if (value === null || value === 'earlybirds') return 'earlybirds';
  if (value === 'latecomers') return 'latecomers';
  return null;
}

function isAuthorized(req: Request, url: URL): boolean {
  const configuredToken = process.env.CRON_SECRET;
  
  // If no secret is configured, allow all requests (useful for Vercel cron + local dev)
  if (!configuredToken) {
    console.log('[auth] No CRON_SECRET configured; allowing request');
    return true;
  }

  // Vercel cron uses x-vercel-proxy-signature; custom auth uses Authorization header
  const vercelSig = req.headers.get('x-vercel-proxy-signature');
  if (vercelSig) {
    console.log('[auth] Vercel cron detected; allowing');
    return true;
  }

  const authHeader = req.headers.get('Authorization');
  const expectedValue = `Bearer ${configuredToken}`;

  if (authHeader !== expectedValue) {
    console.error('[auth] Bearer token mismatch');
    console.error('Received:', authHeader);
    console.error('Expected:', expectedValue);
    return false;
  }

  return true;
}

async function handleSchedulerRequest(req: Request) {
  try {
    const url = new URL(req.url);
    const headersObj = Object.fromEntries(req.headers.entries());
    console.log("All incoming headers:", JSON.stringify(headersObj, null, 2));
    if (!isAuthorized(req, url)) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const window = parseWindow(url.searchParams.get('window'));
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

export async function GET(req: Request) {
  return handleSchedulerRequest(req);
}

export async function POST(req: Request) {
  return handleSchedulerRequest(req);
}
