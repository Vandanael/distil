/**
 * POST /api/feed/refresh
 * Pipeline découverte agent (discovery -> parse -> ingest) pour le user authentifié.
 * Route déclenchable manuellement (bookmarklet, push futur), rate-limitée.
 *
 * Depuis la migration 00031, les articles découverts alimentent la table
 * `items` + `item_embeddings` (pool unifié avec les items RSS), pas directement
 * `articles`. Le ranking (cron rank) décide ensuite ce qui entre dans l'édition.
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createHash } from 'crypto'
import { runDiscoveryAgent } from '@/lib/agents/discovery-agent'
import { parseUrl, type ParsedArticle } from '@/lib/parsing/readability'
import { generateEmbedding } from '@/lib/embeddings/voyage'
import { resolveLanguage, type SupportedLanguage } from '@/lib/parsing/language'
import { checkRefreshRateLimit } from '@/lib/rate-limit'
import { enforceRateLimit } from '@/lib/api-rate-limit'
import type { UserProfile } from '@/lib/agents/types'

// Pipeline découverte + parse + embeddings peut prendre 30-60s selon Gemini.
export const maxDuration = 90

function contentHash(url: string, title: string | null, content: string): string {
  const raw = `${url}|${title ?? ''}|${content.slice(0, 500)}`
  return createHash('sha256').update(raw).digest('hex')
}

export async function POST(request: Request) {
  const blocked = await enforceRateLimit('expensive', request)
  if (blocked) return blocked

  const supabase = await createClient()

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

  const structured = profile.profile_structured as Record<string, unknown> | null
  const rawLang = structured?.language
  const profileLanguage: 'fr' | 'en' | 'both' | null =
    rawLang === 'fr' || rawLang === 'en' || rawLang === 'both' ? rawLang : null

  // Feeds fictifs agent (un par langue, seedés migration 00031).
  const { data: agentFeeds } = await supabase
    .from('feeds')
    .select('id, language')
    .eq('kind', 'agent')

  const agentFeedByLang = new Map<SupportedLanguage, string>()
  for (const f of agentFeeds ?? []) {
    if (f.language === 'fr' || f.language === 'en') {
      agentFeedByLang.set(f.language, f.id)
    }
  }
  if (!agentFeedByLang.has('fr') || !agentFeedByLang.has('en')) {
    return NextResponse.json({ error: 'Feeds agent introuvables (FR ou EN)' }, { status: 503 })
  }

  // URLs déjà ingérées par ce user (7j) : dedup avant discovery LLM.
  const { data: existingItems } = await supabase
    .from('items')
    .select('url')
    .eq('user_id', user.id)
    .gte('fetched_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

  const knownUrls = (existingItems ?? []).map((i) => i.url)

  const { data: run, error: runError } = await supabase
    .from('scoring_runs')
    .insert({ user_id: user.id, agent_type: 'messages' })
    .select('id')
    .single()

  if (runError || !run) {
    return NextResponse.json({ error: 'Impossible de créer le run' }, { status: 500 })
  }

  const startedAt = Date.now()

  try {
    const discovery = await runDiscoveryAgent(userProfile, knownUrls)

    if (discovery.urls.length === 0) {
      await supabase
        .from('scoring_runs')
        .update({
          completed_at: new Date().toISOString(),
          error: discovery.error ?? 'Aucun article découvert',
          duration_ms: Date.now() - startedAt,
        })
        .eq('id', run.id)

      return NextResponse.json({
        runId: run.id,
        discovered: 0,
        ingested: 0,
        error: discovery.error ?? 'Aucun article découvert',
      })
    }

    const parsedResults = await Promise.allSettled(
      discovery.urls.slice(0, 20).map((url) => parseUrl(url))
    )

    const parsed: ParsedArticle[] = parsedResults
      .filter((r): r is PromiseFulfilledResult<ParsedArticle> => r.status === 'fulfilled')
      .map((r) => r.value)
      .filter((c) => c.contentText.length > 200)

    if (parsed.length === 0) {
      await supabase
        .from('scoring_runs')
        .update({
          completed_at: new Date().toISOString(),
          error: 'Aucun article parsable',
          duration_ms: Date.now() - startedAt,
        })
        .eq('id', run.id)

      return NextResponse.json({
        runId: run.id,
        discovered: discovery.urls.length,
        ingested: 0,
        error: 'Aucun article parsable',
      })
    }

    const itemRows = parsed.map((p) => {
      const lang = resolveLanguage({
        htmlLang: p.htmlLang,
        contentText: p.contentText,
        profileLanguage,
      })
      const feedId = agentFeedByLang.get(lang) as string
      return {
        feed_id: feedId,
        user_id: user.id,
        url: p.url,
        title: p.title,
        author: p.author,
        published_at: p.publishedAt,
        content_text: p.contentText.slice(0, 50_000),
        content_hash: contentHash(p.url, p.title, p.contentText),
        word_count: p.wordCount,
      }
    })

    const { data: insertedItems } = await supabase
      .from('items')
      .upsert(itemRows, { onConflict: 'content_hash', ignoreDuplicates: true })
      .select('id, content_text')

    // Embeddings Voyage pour les items nouvellement insérés uniquement.
    if (insertedItems && insertedItems.length > 0 && process.env.VOYAGE_API_KEY) {
      await Promise.allSettled(
        insertedItems
          .filter((i) => i.content_text)
          .map(async (item) => {
            const embedding = await generateEmbedding(item.content_text as string, user.id)
            await supabase
              .from('item_embeddings')
              .upsert(
                { item_id: item.id, embedding: JSON.stringify(embedding) },
                { onConflict: 'item_id', ignoreDuplicates: true }
              )
          })
      )
    }

    const ingestedCount = insertedItems?.length ?? 0

    await supabase
      .from('scoring_runs')
      .update({
        completed_at: new Date().toISOString(),
        articles_analyzed: parsed.length,
        articles_accepted: ingestedCount,
        articles_rejected: parsed.length - ingestedCount,
        duration_ms: Date.now() - startedAt,
      })
      .eq('id', run.id)

    return NextResponse.json({
      runId: run.id,
      discovered: discovery.urls.length,
      parsed: parsed.length,
      ingested: ingestedCount,
      durationMs: Date.now() - startedAt,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await supabase
      .from('scoring_runs')
      .update({
        completed_at: new Date().toISOString(),
        error: message,
        duration_ms: Date.now() - startedAt,
      })
      .eq('id', run.id)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
