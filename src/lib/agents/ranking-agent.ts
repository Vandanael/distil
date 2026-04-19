import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'
import { prefilterCandidates } from './prefilter'
import {
  RANKING_SYSTEM_PROMPT,
  buildRankingUserPrompt,
  MAX_SIGNALS_PER_BUCKET,
  type RecentSignals,
} from './ranking-prompts'
import { parseUrl } from '@/lib/parsing/readability'
import type { ServiceClient } from '@/lib/supabase/types'
import type { Database } from '@/lib/supabase/database.types'
import type { RankedItem, RankingCandidate, RankingResult } from './ranking-types'

type ArticleInsert = Database['public']['Tables']['articles']['Insert']

const MODEL = 'gemini-2.5-flash'
const FALLBACK_MODEL = 'gemini-2.0-flash'

// Seuil dur : un article Q1 < MIN_Q1_RELEVANCE est hors-sujet pour ce lecteur
// et n'a le droit d'apparaitre dans aucun bucket. Garde-fou si le prompt rate.
export const MIN_Q1_RELEVANCE = 6

// Garde-fou anti-fuite cosine : un item que le LLM classe Q1 >= 7 alors que sa
// distance au profil depasse ce seuil est incoherent (ex: Dezeen en Politique).
// On le deplace dans surprise, ou on le drop si deja en surprise.
export const MAX_ESSENTIAL_DISTANCE = 0.6
export const HIGH_RELEVANCE_Q1 = 7

// Slots reserves dans essential pour les top keyword_hits par ts_rank.
// Filet de securite : si le LLM ignore la regle [MATCH] et exclut ces items,
// on les force dans essential. La telemetrie keyword_hits_force_injected
// mesure la frequence d'activation (si eleve, la regle prompt ne tient pas).
export const RESERVED_KEYWORD_SLOTS = 2
export const ESSENTIAL_MAX = 5

type LlmRankedItem = {
  item_id: string
  q1: number
  q2: number
  q3: number
  justification: string
}

type LlmResponse = {
  essential: LlmRankedItem[]
  surprise: LlmRankedItem[]
}

export function enforceMinRelevance(items: LlmRankedItem[]): LlmRankedItem[] {
  return items.filter((item) => (item.q1 ?? 0) >= MIN_Q1_RELEVANCE)
}

/**
 * Force-injecte les top keyword_hits (par ts_rank) dans essential s'ils n'y
 * sont pas deja. Garantit la "promesse mot-cle" meme si le LLM ignore la
 * regle [MATCH]. Ejecte les items non-keyword en queue d'essential.
 */
export function injectReservedKeywordSlots(
  essential: RankedItem[],
  surprise: RankedItem[],
  candidates: RankingCandidate[]
): { essential: RankedItem[]; forceInjected: number } {
  const candById = new Map(candidates.map((c) => [c.itemId, c]))
  const isKwHit = (id: string) => candById.get(id)?.isKeywordHit ?? false

  const existingKwEssential = essential.filter((r) => isKwHit(r.itemId)).length
  const slotsNeeded = Math.max(0, RESERVED_KEYWORD_SLOTS - existingKwEssential)
  if (slotsNeeded === 0) return { essential, forceInjected: 0 }

  const promotedIds = new Set([...essential, ...surprise].map((r) => r.itemId))
  const toInject = candidates
    .filter((c) => c.isKeywordHit && !promotedIds.has(c.itemId))
    .sort((a, b) => b.keywordRank - a.keywordRank)
    .slice(0, slotsNeeded)

  if (toInject.length === 0) return { essential, forceInjected: 0 }

  const kwInEssential = essential.filter((r) => isKwHit(r.itemId))
  const nonKwInEssential = essential.filter((r) => !isKwHit(r.itemId))
  // On grandit essential jusqu'a ESSENTIAL_MAX avant d'ejecter. Exemple :
  // LLM retourne 2 essentials + on injecte 2 -> final = 4, pas 2. L'ejection
  // se declenche uniquement si essential est deja sature (>= ESSENTIAL_MAX).
  const keptCount = Math.min(
    nonKwInEssential.length,
    Math.max(0, ESSENTIAL_MAX - kwInEssential.length - toInject.length)
  )
  const keptNonKw = nonKwInEssential.slice(0, keptCount)

  const injected: RankedItem[] = toInject.map((c) => ({
    itemId: c.itemId,
    q1: MIN_Q1_RELEVANCE,
    q2: 5,
    q3: 6,
    justification: 'Match mot-cle declare (slot reserve).',
    bucket: 'essential' as const,
    rank: 0,
  }))

  const merged = [...kwInEssential, ...keptNonKw, ...injected].map((item, i) => ({
    ...item,
    rank: i + 1,
  }))

  return { essential: merged, forceInjected: toInject.length }
}

export function applyCosineGuard(
  essential: LlmRankedItem[],
  surprise: LlmRankedItem[],
  candidates: RankingCandidate[]
): { essential: LlmRankedItem[]; surprise: LlmRankedItem[] } {
  const distanceByItem = new Map(candidates.map((c) => [c.itemId, c.distance]))
  const isFarClaim = (item: LlmRankedItem) => {
    const distance = distanceByItem.get(item.item_id)
    return (
      item.q1 >= HIGH_RELEVANCE_Q1 && distance !== undefined && distance > MAX_ESSENTIAL_DISTANCE
    )
  }

  const keptEssential: LlmRankedItem[] = []
  const downgraded: LlmRankedItem[] = []
  for (const item of essential) {
    if (isFarClaim(item)) downgraded.push(item)
    else keptEssential.push(item)
  }

  // Items deja en surprise mais avec Q1 >= 7 et distance > seuil : drop (pas de
  // deuxieme chance, ils pretendent etre pertinents tout en etant loin du profil).
  const keptSurprise = surprise.filter((item) => !isFarClaim(item))

  return {
    essential: keptEssential,
    surprise: [...keptSurprise, ...downgraded],
  }
}

// Fenetre d'injection des signaux dans le prompt (ADR-012). 14 jours = cycle
// court pour ressentir l'effet d'un clic sans diluer par de vieux feedbacks.
const SIGNAL_WINDOW_DAYS = 14

async function loadRecentSignals(supabase: ServiceClient, userId: string): Promise<RecentSignals> {
  const cutoff = new Date(Date.now() - SIGNAL_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString()

  const [positiveResult, rejectedResult] = await Promise.all([
    supabase
      .from('articles')
      .select('title, site_name')
      .eq('user_id', userId)
      .eq('positive_signal', true)
      .gte('scored_at', cutoff)
      .order('scored_at', { ascending: false })
      .limit(MAX_SIGNALS_PER_BUCKET),
    supabase
      .from('articles')
      .select('title, site_name')
      .eq('user_id', userId)
      .eq('status', 'rejected')
      .eq('rejection_reason', 'off_topic')
      .gte('scored_at', cutoff)
      .order('scored_at', { ascending: false })
      .limit(MAX_SIGNALS_PER_BUCKET),
  ])

  return {
    positive: (positiveResult.data ?? []).map((r) => ({
      title: r.title,
      siteName: r.site_name,
    })),
    rejected: (rejectedResult.data ?? []).map((r) => ({
      title: r.title,
      siteName: r.site_name,
    })),
  }
}

async function loadUserProfile(
  supabase: ServiceClient,
  userId: string
): Promise<{
  staticProfile: string | null
  longTermProfile: string | null
  shortTermProfile: string | null
  fallbackText: string | null
  embedding: number[] | null
}> {
  const [profileTextResult, profileResult] = await Promise.all([
    supabase
      .from('user_profile_text')
      .select('static_profile, long_term_profile, short_term_profile')
      .eq('user_id', userId)
      .single(),
    supabase
      .from('profiles')
      .select('profile_text, sector, interests, pinned_sources, embedding')
      .eq('id', userId)
      .single(),
  ])

  const pt = profileTextResult.data
  const p = profileResult.data

  const fallbackParts: string[] = []
  if (p?.profile_text) fallbackParts.push(p.profile_text)
  if (p?.sector) fallbackParts.push(`Secteur: ${p.sector}`)
  const interests = p?.interests as string[] | null | undefined
  if (interests && interests.length > 0) fallbackParts.push(`Interets: ${interests.join(', ')}`)

  // pgvector renvoie l'embedding en string JSON via PostgREST, pas en number[].
  // On parse explicitement pour que le downstream recoive un vrai tableau.
  let embedding: number[] | null = null
  if (p?.embedding != null) {
    embedding =
      typeof p.embedding === 'string'
        ? (JSON.parse(p.embedding) as number[])
        : (p.embedding as unknown as number[])
  }

  return {
    staticProfile: pt?.static_profile ?? null,
    longTermProfile: pt?.long_term_profile ?? null,
    shortTermProfile: pt?.short_term_profile ?? null,
    fallbackText: fallbackParts.length > 0 ? fallbackParts.join('. ') : null,
    embedding,
  }
}

async function callRankingLlm(
  profilePrompt: ReturnType<typeof buildRankingUserPrompt>,
  modelId: string,
  userId: string
): Promise<LlmResponse> {
  const { assertBudget, assertUserBudget, recordProviderCall, recordUserProviderCall } =
    await import('@/lib/api-budget')
  await assertUserBudget('gemini', userId)
  await assertBudget('gemini')

  const apiKey = process.env.GOOGLE_AI_API_KEY
  if (!apiKey) throw new Error('GOOGLE_AI_API_KEY manquante')

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: modelId,
    systemInstruction: RANKING_SYSTEM_PROMPT,
    generationConfig: {
      responseMimeType: 'application/json',
      maxOutputTokens: 4096,
      // @ts-expect-error - thinkingConfig not typed in SDK
      thinkingConfig: { thinkingBudget: 0 },
    },
  })

  const result = await model.generateContent(profilePrompt)
  const text = result.response.text()
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Aucun JSON dans la reponse')

  await recordProviderCall('gemini')
  await recordUserProviderCall('gemini', userId)
  return JSON.parse(match[0]) as LlmResponse
}

function cosineFallback(candidates: RankingCandidate[]): {
  essential: RankedItem[]
  surprise: RankedItem[]
} {
  // Sort by cosine distance (closest = most relevant)
  const sorted = [...candidates].sort((a, b) => a.distance - b.distance)

  const essential: RankedItem[] = sorted.slice(0, 5).map((c, i) => ({
    itemId: c.itemId,
    q1: 10 - i,
    q2: 5,
    q3: 5,
    justification: 'Classement automatique (cosine)',
    bucket: 'essential' as const,
    rank: i + 1,
  }))

  // For surprise : items ranked 15-25 with highest unpop_score
  const surpriseCandidates = sorted
    .slice(15, 25)
    .sort((a, b) => b.unpopScore - a.unpopScore)
    .slice(0, 3)

  const surprise: RankedItem[] = surpriseCandidates.map((c, i) => ({
    itemId: c.itemId,
    q1: MIN_Q1_RELEVANCE,
    q2: 7,
    q3: 6,
    justification: 'Decouverte automatique (rarete)',
    bucket: 'surprise' as const,
    rank: i + 1,
  }))

  return { essential, surprise }
}

async function persistRanking(
  supabase: ServiceClient,
  userId: string,
  date: string,
  essential: RankedItem[],
  surprise: RankedItem[],
  candidates: RankingCandidate[]
): Promise<void> {
  const allRanked = [...essential, ...surprise]
  const candidateMap = new Map(candidates.map((c) => [c.itemId, c]))

  // Insert daily_ranking
  if (allRanked.length > 0) {
    const { error: rankingError } = await supabase.from('daily_ranking').upsert(
      allRanked.map((item) => ({
        user_id: userId,
        date,
        bucket: item.bucket,
        item_id: item.itemId,
        rank: item.rank,
        justification: item.justification,
        q1_relevance: item.q1,
        q2_unexpected: item.q2,
        q3_discovery: item.q3,
      })),
      { onConflict: 'user_id,date,item_id' }
    )
    if (rankingError) {
      const { logError } = await import('@/lib/errors/log-error')
      await logError({ route: 'persistRanking.daily_ranking', error: rankingError, userId })
    }
  }

  // Promote to articles table, then enrich with full content via Readability.
  // Parsing en parallele (fetch deja protege par timeout 10s dans fetcher.ts).
  await Promise.allSettled(
    allRanked.map(async (item) => {
      const candidate = candidateMap.get(item.itemId)
      if (!candidate) return

      const articleRow: ArticleInsert = {
        user_id: userId,
        item_id: item.itemId,
        url: candidate.url,
        title: candidate.title,
        author: candidate.author,
        site_name: candidate.siteName,
        published_at: candidate.publishedAt,
        content_text: candidate.contentPreview,
        word_count: candidate.wordCount,
        score: item.q1 * 10,
        justification: item.justification,
        is_serendipity: item.bucket === 'surprise',
        status: 'accepted',
        origin: 'agent',
        scored_at: new Date().toISOString(),
      }

      try {
        const parsed = await parseUrl(candidate.url)
        articleRow.content_html = parsed.contentHtml
        articleRow.content_text = parsed.contentText
        articleRow.excerpt = parsed.excerpt
        articleRow.reading_time_minutes = parsed.readingTimeMinutes
        articleRow.og_image_url = parsed.ogImageUrl
        articleRow.word_count = parsed.wordCount
        if (parsed.author) articleRow.author = parsed.author
      } catch {
        // Paywall, timeout, JS-only - on insere quand meme sans content_html
      }

      // L'index UNIQUE sur articles(user_id, item_id) est partiel (WHERE item_id IS NOT NULL) :
      // Supabase upsert onConflict ne peut pas matcher un index partial → fail silencieux.
      // On fait delete-then-insert explicite par (user_id, item_id) qui est safe et idempotent.
      await supabase.from('articles').delete().eq('user_id', userId).eq('item_id', item.itemId)
      await supabase.from('articles').insert(articleRow)
    })
  )
}

async function rankForUser(supabase: ServiceClient, userId: string): Promise<RankingResult> {
  const start = Date.now()
  const today = new Date().toISOString().slice(0, 10)

  // Check if already ranked today
  const { count } = await supabase
    .from('daily_ranking')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('date', today)

  if ((count ?? 0) > 0) {
    return {
      userId,
      date: today,
      essential: [],
      surprise: [],
      fallback: false,
      modelUsed: null,
      candidatesCount: 0,
      keywordHitsCount: 0,
      keywordHitsPromoted: 0,
      keywordHitsForceInjected: 0,
      error: "Deja classe aujourd'hui",
      durationMs: Date.now() - start,
    }
  }

  const profile = await loadUserProfile(supabase, userId)

  if (!profile.embedding) {
    return {
      userId,
      date: today,
      essential: [],
      surprise: [],
      fallback: false,
      modelUsed: null,
      candidatesCount: 0,
      keywordHitsCount: 0,
      keywordHitsPromoted: 0,
      keywordHitsForceInjected: 0,
      error: "Pas d'embedding profil disponible",
      durationMs: Date.now() - start,
    }
  }

  const [candidates, recentSignals] = await Promise.all([
    prefilterCandidates(supabase, userId, profile.embedding),
    loadRecentSignals(supabase, userId),
  ])

  if (candidates.length === 0) {
    return {
      userId,
      date: today,
      essential: [],
      surprise: [],
      fallback: false,
      modelUsed: null,
      candidatesCount: 0,
      keywordHitsCount: 0,
      keywordHitsPromoted: 0,
      keywordHitsForceInjected: 0,
      error: 'Aucun candidat disponible',
      durationMs: Date.now() - start,
    }
  }

  const userPrompt = buildRankingUserPrompt(
    {
      staticProfile: profile.staticProfile,
      longTermProfile: profile.longTermProfile,
      shortTermProfile: profile.shortTermProfile,
      fallbackText: profile.fallbackText,
    },
    candidates,
    recentSignals
  )

  let essential: RankedItem[] = []
  let surprise: RankedItem[] = []
  let fallback = false
  let modelUsed: string | null = null
  let rankError: string | null = null

  try {
    // Try primary model first, fallback to secondary
    let llmResult: LlmResponse
    try {
      llmResult = await callRankingLlm(userPrompt, MODEL, userId)
      modelUsed = MODEL
    } catch {
      llmResult = await callRankingLlm(userPrompt, FALLBACK_MODEL, userId)
      modelUsed = FALLBACK_MODEL
    }

    // Garde-fou 1 : Q1 < 6 = hors-sujet, purge avant slicing.
    // Garde-fou 2 : Q1 >= 7 avec distance cosine > 0.6 = LLM incoherent avec l'embedding,
    // downgrade dans surprise ou drop si deja en surprise (scenario Dezeen/Politique).
    const guarded = applyCosineGuard(
      enforceMinRelevance(llmResult.essential ?? []),
      enforceMinRelevance(llmResult.surprise ?? []),
      candidates
    )

    essential = guarded.essential.slice(0, 5).map((item, i) => ({
      itemId: item.item_id,
      q1: item.q1,
      q2: item.q2,
      q3: item.q3,
      justification: item.justification,
      bucket: 'essential' as const,
      rank: i + 1,
    }))

    surprise = guarded.surprise.slice(0, 3).map((item, i) => ({
      itemId: item.item_id,
      q1: item.q1,
      q2: item.q2,
      q3: item.q3,
      justification: item.justification,
      bucket: 'surprise' as const,
      rank: i + 1,
    }))
  } catch (err) {
    // Complete LLM failure : cosine fallback
    rankError = err instanceof Error ? err.message : String(err)
    fallback = true
    modelUsed = 'cosine_fallback'
    const fb = cosineFallback(candidates)
    essential = fb.essential
    surprise = fb.surprise
  }

  // Filet de securite : si moins de RESERVED_KEYWORD_SLOTS keyword_hits sont
  // presents dans essential, on les force avant persist. Ne s'applique pas en
  // fallback cosine (pas de signal LLM a corriger).
  let forceInjected = 0
  if (!fallback) {
    const reserved = injectReservedKeywordSlots(essential, surprise, candidates)
    essential = reserved.essential
    forceInjected = reserved.forceInjected
  }

  await persistRanking(supabase, userId, today, essential, surprise, candidates)

  // Telemetrie recall : combien de candidates etaient marques keyword_hit, et
  // combien ont atteint essential+surprise. Sert a valider la regle prompt
  // "ne peut pas etre ignore sans Q1 < 6" dans le temps.
  const keywordHitIds = new Set(candidates.filter((c) => c.isKeywordHit).map((c) => c.itemId))
  const promotedIds = new Set([...essential, ...surprise].map((r) => r.itemId))
  const keywordHitsPromoted = [...keywordHitIds].filter((id) => promotedIds.has(id)).length

  return {
    userId,
    date: today,
    essential,
    surprise,
    fallback,
    modelUsed,
    candidatesCount: candidates.length,
    keywordHitsCount: keywordHitIds.size,
    keywordHitsPromoted,
    keywordHitsForceInjected: forceInjected,
    error: rankError,
    durationMs: Date.now() - start,
  }
}

export async function runDailyRanking(): Promise<RankingResult[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase non configure')
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('onboarding_completed', true)

  if (error || !profiles) {
    throw new Error(`Impossible de charger les profils: ${error?.message}`)
  }

  // Ranking en parallele par profil. Chaque rankForUser gere son propre budget
  // (assertBudget + recordProviderCall) et ses propres erreurs.
  const settled = await Promise.allSettled(
    profiles.map((profile) => rankForUser(supabase, profile.id))
  )

  const results = settled
    .filter((r): r is PromiseFulfilledResult<RankingResult> => r.status === 'fulfilled')
    .map((r) => r.value)

  // Telemetrie : 1 ligne par user par run, utile pour suivre fallback rate et latence
  // sans attendre un bug reporte. Echec insert = non bloquant pour le ranking.
  if (results.length > 0) {
    await supabase
      .from('ranking_runs')
      .insert(
        results.map((r) => ({
          user_id: r.userId,
          date: r.date,
          model_used: r.modelUsed,
          fallback: r.fallback,
          candidates_count: r.candidatesCount,
          essential_count: r.essential.length,
          surprise_count: r.surprise.length,
          duration_ms: r.durationMs,
          error: r.error,
          keyword_hits_count: r.keywordHitsCount,
          keyword_hits_promoted: r.keywordHitsPromoted,
          keyword_hits_force_injected: r.keywordHitsForceInjected,
        }))
      )
      .then(({ error }) => {
        if (error) console.error('[ranking] ranking_runs insert failed', error.message)
      })
  }

  return results
}
