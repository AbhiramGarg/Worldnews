import { Client } from '@upstash/qstash'
import { NextRequest, NextResponse } from 'next/server'
import { getCountriesForWindow } from '@/app/lib/newsSync'

const client = new Client({
  baseUrl: process.env.wn__QSTASH_URL!,
  token: process.env.wn__QSTASH_TOKEN!,
})

type SyncWindow = 'earlybirds' | 'latecomers'
const BATCH_DELAY_SECONDS = 12

function parseWindow(value: string | null): SyncWindow | null {
  if (value === null || value === 'earlybirds') return 'earlybirds'
  if (value === 'latecomers') return 'latecomers'
  return null
}

function isLoopbackHost(hostname: string): boolean {
  const host = hostname.trim().toLowerCase()
  return host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '[::1]'
}

function resolvePublicBaseUrl(request: NextRequest): string {
  const candidates = [
    process.env.SYNC_TARGET_BASE_URL,
    process.env.NEXT_PUBLIC_BASE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined,
    process.env.VERCEL_BRANCH_URL ? `https://${process.env.VERCEL_BRANCH_URL}` : undefined,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    request.nextUrl.origin,
  ]

  for (const candidate of candidates) {
    if (!candidate) continue
    try {
      const normalized = candidate.trim().replace(/\/$/, '')
      const url = new URL(normalized)
      if (url.protocol !== 'https:') continue
      if (isLoopbackHost(url.hostname)) continue
      return normalized
    } catch {
      continue
    }
  }

  throw new Error(
    'No valid public HTTPS base URL configured for QStash destination. Set SYNC_TARGET_BASE_URL (recommended) or NEXT_PUBLIC_BASE_URL.'
  )
}

function resolveMessageReference(result: unknown): string {
  if (result && typeof result === 'object') {
    const maybeResult = result as { messageId?: unknown; messageIds?: unknown }
    if (typeof maybeResult.messageId === 'string') {
      return maybeResult.messageId
    }
    if (Array.isArray(maybeResult.messageIds)) {
      const first = maybeResult.messageIds[0]
      if (typeof first === 'string') {
        return first
      }
    }
  }

  return 'unknown'
}

async function publishSync(window: SyncWindow, request: NextRequest) {
  const baseUrl = resolvePublicBaseUrl(request)
  const route = `api/fetch?window=${window}`
  const countries = getCountriesForWindow(window)

  const publishResults = await Promise.all(
    countries.map((country, index) => {
      const delaySeconds = index * BATCH_DELAY_SECONDS
      const delay = delaySeconds > 0 ? (`${BigInt(delaySeconds)}s` as const) : undefined

      return client.publishJSON({
        url: `${baseUrl}/${route}`,
        body: {
          window,
          countries: [country],
          replaceCountries: true,
          resetBeforeInsert: false,
          batchIndex: index + 1,
          totalBatches: countries.length,
        },
        delay,
        retries: 0,
      })
    })
  )

  return NextResponse.json(
    {
      window,
      totalCountries: countries.length,
      totalBatches: countries.length,
      messages: publishResults.map((result, index) => ({
        messageId: resolveMessageReference(result),
        batchIndex: index + 1,
        countries: [countries[index]],
      })),
    },
    { status: 200 }
  )
}

export const GET = async (request: NextRequest) => {
  const window = parseWindow(request.nextUrl.searchParams.get('window'))
  if (!window) {
    return NextResponse.json({ error: 'invalid window, expected earlybirds or latecomers' }, { status: 400 })
  }

  try {
    return await publishSync(window, request)
  } catch (error) {
    console.error('GET /api/trigger-sync failed', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'publish failed' }, { status: 500 })
  }
}

export const POST = async (request: NextRequest) => {
  const body = await request.json().catch(() => ({})) as { window?: string }
  const window = parseWindow(body.window ?? request.nextUrl.searchParams.get('window'))
  if (!window) {
    return NextResponse.json({ error: 'invalid window, expected earlybirds or latecomers' }, { status: 400 })
  }

  try {
    return await publishSync(window, request)
  } catch (error) {
    console.error('POST /api/trigger-sync failed', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'publish failed' }, { status: 500 })
  }
}