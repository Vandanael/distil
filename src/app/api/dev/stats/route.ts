/**
 * GET /api/dev/stats
 * Expose les indicateurs ranking J-7 : taux de fallback, latence, volumes.
 * Protege par CRON_SECRET (Authorization: Bearer) puisque c'est service-role only.
 * Lecture de ranking_runs qui est deny-all sous RLS, on utilise donc le service-role client.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyCronSecret } from '@/lib/auth/cron'

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Supabase non configure' }, { status: 503 })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const { data: runs, error } = await supabase
    .from('ranking_runs')
    .select(
      'user_id, date, model_used, fallback, candidates_count, essential_count, surprise_count, duration_ms, error'
    )
    .gte('date', sevenDaysAgo)
    .order('date', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows = runs ?? []
  const total = rows.length
  const fallbackCount = rows.filter((r) => r.fallback).length
  const errorCount = rows.filter((r) => r.error).length
  const durations = rows
    .map((r) => r.duration_ms)
    .filter((d): d is number => typeof d === 'number' && d > 0)
    .sort((a, b) => a - b)
  const p50 = durations.length > 0 ? durations[Math.floor(durations.length / 2)] : null
  const p95 =
    durations.length > 0 ? durations[Math.max(0, Math.ceil(durations.length * 0.95) - 1)] : null

  const byModel = rows.reduce<Record<string, number>>((acc, r) => {
    const key = r.model_used ?? 'none'
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})

  return NextResponse.json({
    windowStart: sevenDaysAgo,
    totalRuns: total,
    fallbackRate: total > 0 ? fallbackCount / total : 0,
    errorRate: total > 0 ? errorCount / total : 0,
    durationMs: { p50, p95 },
    byModel,
    runs: rows,
  })
}
