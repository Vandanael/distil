import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { runScoringAgent } from '@/lib/agents/scoring-agent'
import { parseUrl } from '@/lib/parsing/readability'
import type { ArticleCandidate, UserProfile } from '@/lib/agents/types'

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Supabase non configure' }, { status: 503 })
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

  // Lire les URLs candidates depuis le body
  const body: unknown = await request.json()
  if (
    typeof body !== 'object' ||
    body === null ||
    !Array.isArray((body as Record<string, unknown>).urls)
  ) {
    return NextResponse.json(
      { error: 'Corps invalide : { urls: string[] } attendu' },
      { status: 400 }
    )
  }

  const urls: string[] = (body as { urls: string[] }).urls.slice(0, 20)

  // Charger le profil
  const { data: profile } = await supabase
    .from('profiles')
    .select(
      'profile_text, profile_structured, sector, interests, pinned_sources, daily_cap, serendipity_quota'
    )
    .eq('id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })
  }

  const userProfile: UserProfile = {
    profileText: profile.profile_text ?? null,
    profileStructured: profile.profile_structured ?? null,
    sector: profile.sector ?? null,
    interests: profile.interests ?? [],
    pinnedSources: profile.pinned_sources ?? [],
    dailyCap: profile.daily_cap ?? 10,
    serendipityQuota: profile.serendipity_quota ?? 0.15,
  }

  // Creer le scoring_run
  const { data: run, error: runError } = await supabase
    .from('scoring_runs')
    .insert({ user_id: user.id, agent_type: 'messages' })
    .select('id')
    .single()

  if (runError || !run) {
    return NextResponse.json({ error: 'Impossible de creer le run' }, { status: 500 })
  }

  // Parser les URLs en parallele (echecs ignores individuellement)
  const candidates: ArticleCandidate[] = (
    await Promise.allSettled(urls.map((url) => parseUrl(url)))
  )
    .filter(
      (r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof parseUrl>>> =>
        r.status === 'fulfilled'
    )
    .map((r) => ({
      url: r.value.url,
      title: r.value.title,
      excerpt: r.value.excerpt,
      contentText: r.value.contentText,
      siteName: r.value.siteName,
    }))

  if (candidates.length === 0) {
    await supabase
      .from('scoring_runs')
      .update({ completed_at: new Date().toISOString(), error: 'Aucun article parsable' })
      .eq('id', run.id)

    return NextResponse.json({
      runId: run.id,
      accepted: 0,
      rejected: 0,
      error: 'Aucun article parsable',
    })
  }

  // Lancer le scoring
  const result = await runScoringAgent({ profile: userProfile, candidates, runId: run.id })

  // Persister les articles scores
  const accepted = result.scored.filter((a) => a.accepted)
  const rejected = result.scored.filter((a) => !a.accepted)

  if (result.scored.length > 0) {
    // Trouver les articles parsés pour enrichir les données
    const parsedByUrl = new Map(
      (await Promise.allSettled(urls.map((url) => parseUrl(url))))
        .filter(
          (r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof parseUrl>>> =>
            r.status === 'fulfilled'
        )
        .map((r) => [r.value.url, r.value])
    )

    await supabase.from('articles').insert(
      result.scored.map((scored) => {
        const parsed = parsedByUrl.get(scored.url)
        return {
          user_id: user.id,
          url: scored.url,
          title: parsed?.title ?? null,
          author: parsed?.author ?? null,
          site_name: parsed?.siteName ?? null,
          published_at: parsed?.publishedAt ?? null,
          content_html: parsed?.contentHtml ?? null,
          content_text: parsed?.contentText ?? null,
          excerpt: parsed?.excerpt ?? null,
          word_count: parsed?.wordCount ?? null,
          reading_time_minutes: parsed?.readingTimeMinutes ?? null,
          score: scored.score,
          justification: scored.justification,
          is_serendipity: scored.isSerendipity,
          rejection_reason: scored.rejectionReason,
          accepted: undefined, // pas de colonne accepted, on utilise status
          status: scored.accepted ? 'accepted' : 'rejected',
          scored_at: new Date().toISOString(),
        }
      })
    )
  }

  // Mettre a jour le scoring_run
  await supabase
    .from('scoring_runs')
    .update({
      completed_at: new Date().toISOString(),
      articles_analyzed: result.scored.length,
      articles_accepted: accepted.length,
      articles_rejected: rejected.length,
      agent_type: result.agentType,
      error: result.error,
      duration_ms: result.durationMs,
    })
    .eq('id', run.id)

  return NextResponse.json({
    runId: run.id,
    accepted: accepted.length,
    rejected: rejected.length,
    durationMs: result.durationMs,
    error: result.error,
  })
}
