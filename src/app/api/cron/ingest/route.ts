import { NextRequest, NextResponse } from 'next/server'
import { verifyCronSecret } from '@/lib/auth/cron'
import { ingestAllFeeds } from '@/lib/ingestion/rss-fetcher'

export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
  }

  try {
    const summary = await ingestAllFeeds()
    return NextResponse.json(summary)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
