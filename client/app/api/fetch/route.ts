import { NextResponse } from 'next/server';
import { runNewsSync, type SyncWindow } from '@/app/lib/newsSync';

function parseWindow(value: string | null): SyncWindow | null {
  if (value === null || value === 'earlybirds') return 'earlybirds';
  if (value === 'latecomers') return 'latecomers';
  return null;
}

function isAuthorized(req: Request, url: URL): boolean {
  const configuredToken = process.env.CRON_SECRET;
  if (!configuredToken) return true;

  const authHeader = req.headers.get('authorization');
  if (!authHeader) return false;

  const expectedValue = `Bearer ${configuredToken}`;
  return authHeader === expectedValue;
}

async function handleSchedulerRequest(req: Request) {
  try {
    const url = new URL(req.url);
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
