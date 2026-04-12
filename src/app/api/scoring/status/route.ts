import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Supabase non configure' }, { status: 503 })
  }

  const { searchParams } = new URL(request.url)
  const runId = searchParams.get('runId')
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

  if (!runId || !UUID_RE.test(runId)) {
    return NextResponse.json({ error: 'runId invalide' }, { status: 400 })
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        for (const { name, value, options } of toSet) {
          cookieStore.set(name, value, options)
        }
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })
  }

  const { data: run } = await supabase
    .from('scoring_runs')
    .select('*')
    .eq('id', runId)
    .eq('user_id', user.id)
    .single()

  if (!run) {
    return NextResponse.json({ error: 'Run introuvable' }, { status: 404 })
  }

  return NextResponse.json({
    runId: run.id,
    status: run.completed_at ? 'completed' : 'running',
    startedAt: run.started_at,
    completedAt: run.completed_at,
    articlesAnalyzed: run.articles_analyzed,
    articlesAccepted: run.articles_accepted,
    articlesRejected: run.articles_rejected,
    agentType: run.agent_type,
    durationMs: run.duration_ms,
    error: run.error,
  })
}
