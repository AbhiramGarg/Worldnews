import { Client } from '@upstash/qstash'
import { NextRequest, NextResponse } from 'next/server'

const client = new Client({
  baseUrl: process.env.wn__QSTASH_URL!,
  token: process.env.wn__QSTASH_TOKEN!,
})

type SyncWindow = 'earlybirds' | 'latecomers'

function parseWindow(value: string | null): SyncWindow | null {
  if (value === null || value === 'earlybirds') return 'earlybirds'
  if (value === 'latecomers') return 'latecomers'
  return null
}

async function publishSync(window: SyncWindow) {
  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
  const route = `api/fetch?window=${window}`

  const { messageId } = await client.publishJSON({
    url: `${baseUrl}/${route}`,
  })

  return NextResponse.json({ messageId, window }, { status: 200 })
}

export const GET = async (request: NextRequest) => {
  const window = parseWindow(request.nextUrl.searchParams.get('window'))
  if (!window) {
    return NextResponse.json({ error: 'invalid window, expected earlybirds or latecomers' }, { status: 400 })
  }

  return publishSync(window)
}

export const POST = async (request: NextRequest) => {
  const body = await request.json().catch(() => ({})) as { window?: string }
  const window = parseWindow(body.window ?? request.nextUrl.searchParams.get('window'))
  if (!window) {
    return NextResponse.json({ error: 'invalid window, expected earlybirds or latecomers' }, { status: 400 })
  }

  return publishSync(window)
}