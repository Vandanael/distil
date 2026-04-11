/**
 * POST /api/feed/refresh
 * Pipeline complet : discovery -> dedup -> parse -> score -> insert
 * Lance une recherche d'articles depuis les sources et intérêts du profil utilisateur.
 */
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { runDiscoveryAgent } from '@/lib/agents/discovery-agent'
import { runScoringAgent } from '@/lib/agents/scoring-agent'
import { parseUrl } from '@/lib/parsing/readability'
import { generateEmbedding } from '@/lib/embeddings/voyage'
import type { ArticleCandidate, UserProfile } from '@/lib/agents/types'

export async function POST() {
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

  // Charger les URLs déjà connues pour éviter les doublons
  const { data: existingArticles } = await supabase
    .from('articles')
    .select('url')
    .eq('user_id', user.id)
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // 7 derniers jours

  const knownUrls = (existingArticles ?? []).map((a) => a.url)

  // Créer le scoring_run
  const { data: run, error: runError } = await supabase
    .from('scoring_runs')
    .insert({ user_id: user.id, agent_type: 'messages' })
    .select('id')
    .single()

  if (runError || !run) {
    return NextResponse.json({ error: 'Impossible de créer le run' }, { status: 500 })
  }

  // 1. Discovery : trouver des URLs d'articles
  const discovery = await runDiscoveryAgent(userProfile, knownUrls)

  if (discovery.urls.length === 0) {
    await supabase
      .from('scoring_runs')
      .update({
        completed_at: new Date().toISOString(),
        error: discovery.error ?? 'Aucun article découvert',
      })
      .eq('id', run.id)

    return NextResponse.json({
      runId: run.id,
      discovered: 0,
      accepted: 0,
      rejected: 0,
      error: discovery.error ?? 'Aucun article découvert',
    })
  }

  // 2. Parser les URLs en parallèle (échecs ignorés individuellement)
  const parsedResults = await Promise.allSettled(discovery.urls.map((url) => parseUrl(url)))

  const candidates: ArticleCandidate[] = parsedResults
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
    .filter((c) => c.contentText.length > 200) // filtre les pages sans contenu

  if (candidates.length === 0) {
    await supabase
      .from('scoring_runs')
      .update({ completed_at: new Date().toISOString(), error: 'Aucun article parsable' })
      .eq('id', run.id)

    return NextResponse.json({
      runId: run.id,
      discovered: discovery.urls.length,
      accepted: 0,
      rejected: 0,
      error: 'Aucun article parsable',
    })
  }

  // 3. Scorer les candidats
  const scoringResult = await runScoringAgent({
    profile: userProfile,
    candidates,
    runId: run.id,
  })

  const accepted = scoringResult.scored.filter((a) => a.accepted)
  const rejected = scoringResult.scored.filter((a) => !a.accepted)

  // 4. Persister en base
  if (scoringResult.scored.length > 0) {
    const parsedByUrl = new Map(
      parsedResults
        .filter(
          (r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof parseUrl>>> =>
            r.status === 'fulfilled'
        )
        .map((r) => [r.value.url, r.value])
    )

    const { data: insertedArticles } = await supabase
      .from('articles')
      .insert(
        scoringResult.scored.map((scored) => {
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
            origin: 'agent',
            scored_at: new Date().toISOString(),
          }
        })
      )
      .select('id, url, content_text, status')

    // Embeddings pour les articles acceptés (best-effort)
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

  // Mettre à jour le scoring_run
  await supabase
    .from('scoring_runs')
    .update({
      completed_at: new Date().toISOString(),
      articles_analyzed: scoringResult.scored.length,
      articles_accepted: accepted.length,
      articles_rejected: rejected.length,
      agent_type: scoringResult.agentType,
      error: scoringResult.error,
      duration_ms: scoringResult.durationMs,
    })
    .eq('id', run.id)

  return NextResponse.json({
    runId: run.id,
    discovered: discovery.urls.length,
    parsed: candidates.length,
    accepted: accepted.length,
    rejected: rejected.length,
    durationMs: scoringResult.durationMs,
    error: scoringResult.error,
  })
}
