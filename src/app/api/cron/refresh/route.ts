/**
 * POST /api/cron/refresh
 * Declencheur cron : rafraichit le feed de tous les utilisateurs onboardes.
 * Protege par CRON_SECRET transmis via Authorization: Bearer <secret>.
 * Lance discovery -> parse -> score -> insert pour chaque profil.
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

export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Supabase non configure' }, { status: 503 })
  }

  // Service role : bypass RLS pour lire tous les profils
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Charger tous les utilisateurs onboardes
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select(
      'id, profile_text, profile_structured, sector, interests, pinned_sources, daily_cap, serendipity_quota'
    )
    .eq('onboarding_completed', true)

  if (profilesError || !profiles) {
    return NextResponse.json({ error: 'Impossible de charger les profils' }, { status: 500 })
  }

  const results: Array<{
    userId: string
    discovered: number
    accepted: number
    rejected: number
    error: string | null
  }> = []

  // Traiter chaque utilisateur sequentiellement (evite de surcharger l'API Gemini)
  for (const profile of profiles) {
    try {
      const userProfile: UserProfile = {
        profileText: profile.profile_text ?? null,
        profileStructured: profile.profile_structured ?? null,
        sector: profile.sector ?? null,
        interests: profile.interests ?? [],
        pinnedSources: profile.pinned_sources ?? [],
        dailyCap: profile.daily_cap ?? 10,
        serendipityQuota: profile.serendipity_quota ?? 0.15,
      }

      // URLs deja connues (7 derniers jours) + signaux positifs + signaux negatifs
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
          .eq('status', 'accepted')
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

      // Creer le scoring_run
      const { data: run, error: runError } = await supabase
        .from('scoring_runs')
        .insert({ user_id: profile.id, agent_type: 'messages' })
        .select('id')
        .single()

      if (runError || !run) {
        results.push({
          userId: profile.id,
          discovered: 0,
          accepted: 0,
          rejected: 0,
          error: 'Impossible de creer le run',
        })
        continue
      }

      // Discovery
      const discovery = await runDiscoveryAgent(userProfile, knownUrls)

      if (discovery.urls.length === 0) {
        await supabase
          .from('scoring_runs')
          .update({
            completed_at: new Date().toISOString(),
            error: discovery.error ?? 'Aucun article decouvert',
          })
          .eq('id', run.id)
        results.push({
          userId: profile.id,
          discovered: 0,
          accepted: 0,
          rejected: 0,
          error: discovery.error,
        })
        continue
      }

      // Parse : plafond 20 URLs pour limiter les appels IA downstream
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
        results.push({
          userId: profile.id,
          discovered: discovery.urls.length,
          accepted: 0,
          rejected: 0,
          error: 'Aucun article parsable',
        })
        continue
      }

      // Score (avec signaux positifs + negatifs)
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

      // Persister
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
                status: scored.accepted ? 'accepted' : 'rejected',
                origin: 'agent',
                scored_at: new Date().toISOString(),
              }
            }),
            { onConflict: 'user_id,url', ignoreDuplicates: true }
          )
          .select('id, url, content_text, status')

        // Embeddings : await pour garantir l'execution avant fin de la requete.
        // Scheduled function Netlify : timeout long, pas de risque utilisateur-facing.
        if (insertedArticles && process.env.VOYAGE_API_KEY) {
          await Promise.allSettled(
            insertedArticles
              .filter((a) => a.status === 'accepted' && a.content_text)
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

      // Push notification si l'utilisateur est abonne et a de nouveaux articles
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
          }).catch((err) => console.error('[cron/refresh] push failed', err))
        }
      }

      results.push({
        userId: profile.id,
        discovered: discovery.urls.length,
        accepted: accepted.length,
        rejected: rejected.length,
        error: scoringResult.error,
      })
    } catch (err) {
      results.push({
        userId: profile.id,
        discovered: 0,
        accepted: 0,
        rejected: 0,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  return NextResponse.json({
    usersProcessed: profiles.length,
    results,
  })
}
