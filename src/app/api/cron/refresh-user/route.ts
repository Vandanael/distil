/**
 * POST /api/cron/refresh-user
 * Traite le pipeline refresh (discovery -> parse -> score -> persist -> embed -> push)
 * pour UN seul utilisateur. Appele par la scheduled function daily-refresh-background
 * en fan-out, une invocation par user.
 * Protege par CRON_SECRET transmis via Authorization: Bearer <secret>.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { runDiscoveryAgent } from '@/lib/agents/discovery-agent'
import { runScoringAgent } from '@/lib/agents/scoring-agent'
import { parseUrl } from '@/lib/parsing/readability'
import { generateEmbedding } from '@/lib/embeddings/voyage'
import { sendPushNotification } from '@/lib/push/send'
import type { ArticleCandidate, UserProfile } from '@/lib/agents/types'
import { verifyCronSecret } from '@/lib/auth/cron'

// Pipeline complet peut prendre 30-90s selon la charge Gemini et la taille du profil.
export const maxDuration = 300

export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
  }

  let body: { userId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 })
  }

  const userId = body.userId
  if (!userId || typeof userId !== 'string') {
    return NextResponse.json({ error: 'userId manquant' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Supabase non configure' }, { status: 503 })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select(
      'id, profile_text, profile_structured, sector, interests, pinned_sources, daily_cap, serendipity_quota, onboarding_completed'
    )
    .eq('id', userId)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })
  }

  if (!profile.onboarding_completed) {
    return NextResponse.json({ error: 'Onboarding non termine' }, { status: 400 })
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

  // URLs deja connues (7j) + signaux positifs (archives 14j) + negatifs (rejetes 30j)
  const [existingResult, archivedResult, dismissedResult] = await Promise.all([
    supabase
      .from('articles')
      .select('url')
      .eq('user_id', profile.id)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    supabase
      .from('articles')
      .select('title, site_name')
      .eq('user_id', profile.id)
      .eq('status', 'pending')
      .gte('updated_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
      .limit(20),
    supabase
      .from('articles')
      .select('title, site_name')
      .eq('user_id', profile.id)
      .eq('rejection_reason', 'off_topic')
      .gte('updated_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .limit(15),
  ])

  const knownUrls = (existingResult.data ?? []).map((a) => a.url)
  const archivedTags = (archivedResult.data ?? [])
    .map((a) => [a.title, a.site_name].filter(Boolean).join(' - '))
    .filter(Boolean)
  const negativeExamples = (dismissedResult.data ?? [])
    .map((a) => [a.title, a.site_name].filter(Boolean).join(' - '))
    .filter(Boolean)

  const { data: run, error: runError } = await supabase
    .from('scoring_runs')
    .insert({ user_id: profile.id, agent_type: 'messages' })
    .select('id')
    .single()

  if (runError || !run) {
    return NextResponse.json({ error: 'Impossible de creer le run' }, { status: 500 })
  }

  try {
    const discovery = await runDiscoveryAgent(userProfile, knownUrls)

    if (discovery.urls.length === 0) {
      await supabase
        .from('scoring_runs')
        .update({
          completed_at: new Date().toISOString(),
          error: discovery.error ?? 'Aucun article decouvert',
        })
        .eq('id', run.id)

      return NextResponse.json({
        userId: profile.id,
        runId: run.id,
        discovered: 0,
        accepted: 0,
        rejected: 0,
        error: discovery.error ?? 'Aucun article decouvert',
      })
    }

    const urlsToProcess = discovery.urls.slice(0, 20)
    const parsedResults = await Promise.allSettled(urlsToProcess.map((url) => parseUrl(url)))
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
        author: r.value.author ?? null,
        publishedAt: r.value.publishedAt ?? null,
        wordCount: r.value.wordCount,
      }))
      .filter((c) => c.contentText.length > 200)

    if (candidates.length === 0) {
      await supabase
        .from('scoring_runs')
        .update({ completed_at: new Date().toISOString(), error: 'Aucun article parsable' })
        .eq('id', run.id)

      return NextResponse.json({
        userId: profile.id,
        runId: run.id,
        discovered: discovery.urls.length,
        accepted: 0,
        rejected: 0,
        error: 'Aucun article parsable',
      })
    }

    const scoringResult = await runScoringAgent({
      profile: userProfile,
      candidates,
      runId: run.id,
      userId: profile.id,
      archivedTags,
      negativeExamples,
    })

    const accepted = scoringResult.scored.filter((a) => a.accepted)
    const rejected = scoringResult.scored.filter((a) => !a.accepted)

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
        .upsert(
          scoringResult.scored.map((scored) => {
            const parsed = parsedByUrl.get(scored.url)
            return {
              user_id: profile.id,
              url: scored.url,
              title: parsed?.title ?? null,
              author: parsed?.author ?? null,
              site_name: parsed?.siteName ?? null,
              published_at: parsed?.publishedAt ?? null,
              content_html: parsed?.contentHtml ?? null,
              content_text: parsed?.contentText ?? null,
              excerpt: parsed?.excerpt ?? null,
              word_count: parsed?.wordCount ?? null,
              og_image_url: parsed?.ogImageUrl ?? null,
              reading_time_minutes: parsed?.readingTimeMinutes ?? null,
              score: scored.score,
              justification: scored.justification,
              is_serendipity: scored.isSerendipity,
              rejection_reason: scored.rejectionReason,
              status: scored.accepted ? 'pending' : 'not_interested',
              origin: 'agent',
              scored_at: new Date().toISOString(),
            }
          }),
          { onConflict: 'user_id,url', ignoreDuplicates: true }
        )
        .select('id, url, content_text, status')

      if (insertedArticles && process.env.VOYAGE_API_KEY) {
        await Promise.allSettled(
          insertedArticles
            .filter((a) => a.status === 'pending' && a.content_text)
            .map(async (article) => {
              const embedding = await generateEmbedding(article.content_text as string, profile.id)
              await supabase.from('articles').update({ embedding }).eq('id', article.id)
            })
        )
      }
    }

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

    if (accepted.length > 0) {
      const pushSub = (profile.profile_structured as Record<string, unknown> | null)
        ?.pushSubscription as PushSubscriptionJSON | undefined
      if (pushSub?.endpoint) {
        await sendPushNotification(pushSub, {
          title: 'Distil',
          body:
            accepted.length === 1
              ? '1 nouvel article dans votre veille.'
              : `${accepted.length} nouveaux articles dans votre veille.`,
          url: '/feed',
        }).catch((err) => console.error('[cron/refresh-user] push failed', err))
      }
    }

    return NextResponse.json({
      userId: profile.id,
      runId: run.id,
      discovered: discovery.urls.length,
      parsed: candidates.length,
      accepted: accepted.length,
      rejected: rejected.length,
      durationMs: scoringResult.durationMs,
      error: scoringResult.error,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await supabase
      .from('scoring_runs')
      .update({ completed_at: new Date().toISOString(), error: message })
      .eq('id', run.id)
    return NextResponse.json({ userId: profile.id, error: message }, { status: 500 })
  }
}
