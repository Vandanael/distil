import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { createServiceClient } from '@/lib/supabase/server'
import { runRankingForUser } from '@/lib/agents/ranking-agent'

function verifyAdminToken(authHeader: string | null): boolean {
  const token = process.env.ADMIN_TOKEN
  if (!token || !authHeader) return false
  const a = Buffer.from(authHeader)
  const b = Buffer.from(token)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(req: NextRequest) {
  if (!verifyAdminToken(req.headers.get('x-admin-token'))) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
  }

  let userId: string
  try {
    const body = await req.json()
    if (typeof body.user_id !== 'string' || !UUID_RE.test(body.user_id)) {
      return NextResponse.json({ error: 'user_id invalide (UUID requis)' }, { status: 400 })
    }
    userId = body.user_id
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 })
  }

  const supabase = await createServiceClient()

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'User introuvable' }, { status: 404 })
  }

  // Supprime le daily_ranking du jour pour forcer le re-ranking
  const today = new Date().toISOString().slice(0, 10)
  await supabase.from('daily_ranking').delete().eq('user_id', userId).eq('date', today)

  const result = await runRankingForUser(supabase, userId)

  return NextResponse.json({
    user_id: result.userId,
    essential: result.essential.length,
    surprise: result.surprise.length,
    duration_ms: result.durationMs,
    error: result.error,
    ranking_run: {
      candidates_count: result.candidatesCount,
      cosine_p25: result.cosineP25,
      cosine_p50: result.cosineP50,
      cosine_p75: result.cosineP75,
      guard_downgrades_count: result.guardDowngrades,
      keyword_hits_count: result.keywordHitsCount,
    },
  })
}
