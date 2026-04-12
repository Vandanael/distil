import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { runScoringAgent } from '@/lib/agents/scoring-agent'
import { parseUrl } from '@/lib/parsing/readability'
import { generateEmbedding } from '@/lib/embeddings/voyage'
import { checkRefreshRateLimit } from '@/lib/rate-limit'
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

  const retryAfter = await checkRefreshRateLimit(supabase, user.id)
  if (retryAfter !== null) {
    return NextResponse.json(
      { error: 'Trop de requetes. Attendez quelques minutes avant de relancer.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    )
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

  // Charger le profil + signaux feedback en parallele
  const [profileResult, archivedResult, dismissedResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('profile_text, profile_structured, sector, interests, pinned_sources, daily_cap, serendipity_quota')
      .eq('id', user.id)
      .single(),
    supabase
      .from('articles')
      .select('title, site_name')
      .eq('user_id', user.id)
      .eq('status', 'accepted')
      .gte('updated_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
      .limit(20),
    supabase
      .from('articles')
      .select('title, site_name')
      .eq('user_id', user.id)
      .eq('rejection_reason', 'off_topic')
      .gte('updated_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .limit(15),
  ])

  const profile = profileResult.data
  if (!profile) {
    return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })
  }

  const archivedTags = (archivedResult.data ?? [])
    .map((a) => [a.title, a.site_name].filter(Boolean).join(' — '))
    .filter(Boolean)

  const negativeExamples = (dismissedResult.data ?? [])
    .map((a) => [a.title, a.site_name].filter(Boolean).join(' — '))
    .filter(Boolean)

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

  // Parser les URLs en parallele — on conserve les resultats pour eviter un double-parse
  const parseResults = await Promise.allSettled(urls.map((url) => parseUrl(url)))
  const parsedByUrl = new Map(
    parseResults
      .filter(
        (r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof parseUrl>>> =>
          r.status === 'fulfilled'
      )
      .map((r) => [r.value.url, r.value])
  )

  const candidates: ArticleCandidate[] = Array.from(parsedByUrl.values()).map((r) => ({
    url: r.url,
    title: r.title,
    excerpt: r.excerpt,
    contentText: r.contentText,
    siteName: r.siteName,
    author: r.author ?? null,
    publishedAt: r.publishedAt ?? null,
    wordCount: r.wordCount,
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

  // Lancer le scoring avec les signaux feedback
  const result = await runScoringAgent({
    profile: userProfile,
    candidates,
    runId: run.id,
    archivedTags,
    negativeExamples,
  })

  // Persister les articles scores
  const accepted = result.scored.filter((a) => a.accepted)
  const rejected = result.scored.filter((a) => !a.accepted)

  if (result.scored.length > 0) {

    const { data: insertedArticles } = await supabase
      .from('articles')
      .insert(
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
            status: scored.accepted ? 'accepted' : 'rejected',
            scored_at: new Date().toISOString(),
          }
        })
      )
      .select('id, url, content_text, status')

    // Générer les embeddings pour les articles acceptés (best-effort, non bloquant)
    if (insertedArticles && process.env.VOYAGE_API_KEY) {
      void Promise.allSettled(
        insertedArticles
          .filter((a) => a.status === 'accepted' && a.content_text)
          .map(async (article) => {
            const embedding = await generateEmbedding(article.content_text as string)
            await supabase.from('articles').update({ embedding }).eq('id', article.id)
          })
      )
    }
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
