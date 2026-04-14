import { NextRequest, NextResponse } from 'next/server'
import { verifyCronSecret } from '@/lib/auth/cron'
import { runDailyRanking } from '@/lib/agents/ranking-agent'

export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
  }

  try {
    const results = await runDailyRanking()

    const summary = results.map((r) => ({
      userId: r.userId,
      date: r.date,
      essential: r.essential.length,
      surprise: r.surprise.length,
      fallback: r.fallback,
      error: r.error,
      durationMs: r.durationMs,
    }))

    return NextResponse.json({
      usersProcessed: results.length,
      results: summary,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
