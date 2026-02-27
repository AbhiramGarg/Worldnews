import { NextRequest, NextResponse } from 'next/server';
import {
  getMissingCountriesReport,
  retryMissingCountries,
  type SyncWindow,
} from '@/app/lib/newsSync';

export const runtime = 'nodejs';

function parseWindow(value: string | null): SyncWindow | null {
  if (value === null || value === 'earlybirds') return 'earlybirds';
  if (value === 'latecomers') return 'latecomers';
  return null;
}

function normalizeCountries(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const countries = value
    .map((country) => String(country).toLowerCase().trim())
    .filter(Boolean);

  return countries.length > 0 ? countries : undefined;
}

async function resolveCountries(req: Request, url: URL): Promise<string[] | undefined> {
  if (req.method !== 'POST') {
    const queryCountries = url.searchParams.get('countries');
    if (!queryCountries) {
      return undefined;
    }

    const countries = queryCountries
      .split(',')
      .map((country) => country.toLowerCase().trim())
      .filter(Boolean);

    return countries.length > 0 ? countries : undefined;
  }

  const payload = await req.clone().json().catch(() => ({})) as { countries?: unknown };
  return normalizeCountries(payload.countries);
}

function shouldOnlyReport(req: Request, url: URL): boolean {
  if (req.method !== 'POST') {
    return url.searchParams.get('onlyReport') === 'true';
  }

  return false;
}

async function handleManualRecovery(req: Request) {
  try {
    const url = new URL(req.url);
    const window = parseWindow(url.searchParams.get('window'));

    if (!window) {
      return NextResponse.json(
        { error: 'invalid window, expected earlybirds or latecomers' },
        { status: 400 },
      );
    }

    const countries = await resolveCountries(req, url);

    if (shouldOnlyReport(req, url)) {
      const report = await getMissingCountriesReport(window, countries);
      return NextResponse.json({
        message: 'missing countries report generated',
        ...report,
      });
    }

    const result = await retryMissingCountries(window, countries);

    return NextResponse.json({
      message: result.retried
        ? 'missing countries retried'
        : 'no missing countries detected',
      ...result,
    });
  } catch (error) {
    console.error('manual missing-country recovery failed', error);
    return NextResponse.json({ error: 'manual recovery failed' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return handleManualRecovery(req);
}

export async function POST(req: NextRequest) {
  return handleManualRecovery(req);
}
