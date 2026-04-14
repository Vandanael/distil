import { NextRequest, NextResponse } from 'next/server'
import { verifyCronSecret } from '@/lib/auth/cron'
import { embedNewItems } from '@/lib/ingestion/embed-items'

export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
  }

  try {
    const result = await embedNewItems()
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
