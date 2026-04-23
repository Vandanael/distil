import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'
import { prefilterCandidates } from './prefilter'
import {
  getRankingSystemPrompt,
  buildRankingUserPrompt,
  MAX_SIGNALS_PER_BUCKET,
  type RankingLocale,
  type RecentSignals,
} from './ranking-prompts'
import { parseUrl } from '@/lib/parsing/readability'
import type { ServiceClient } from '@/lib/supabase/types'
import type { Database } from '@/lib/supabase/database.types'
import type { RankedItem, RankingCandidate, RankingResult } from './ranking-types'
import { resolveRssRatio, RSS_RELEVANCE_DISTANCE_MAX, MIN_WORD_COUNT, type DiscoveryMode } from '@/lib/ranking/weights'

type ArticleInsert = Database['public']['Tables']['articles']['Insert']

type CarryOverArticle = {
  id: string
  item_id: string
  score: number | null
  justification: string | null
  is_serendipity: boolean
}

const MODEL = 'gemini-2.5-flash'
const FALLBACK_MODEL = 'gemini-flash-latest'

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

export type LlmRankedItem = {
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

export type LlmRawItem = {
  item_id: number | string
  q1: number
  q2: number
  q3: number
  justification: string
}

type LlmRawResponse = {
  essential: LlmRawItem[]
  surprise: LlmRawItem[]
}

export function resolveIndexedItems(
  rawItems: LlmRawItem[],
  indexMap: Map<number, string>
): { items: LlmRankedItem[]; invalidIndices: (number | string)[] } {
  const items: LlmRankedItem[] = []
  const invalidIndices: (number | string)[] = []
  for (const raw of rawItems) {
    const idx = Number(raw.item_id)
    const uuid = !Number.isNaN(idx) ? indexMap.get(idx) : undefined
    if (!uuid) {
      invalidIndices.push(raw.item_id)
      continue
    }
    items.push({ item_id: uuid, q1: raw.q1, q2: raw.q2, q3: raw.q3, justification: raw.justification })
  }
  return { items, invalidIndices }
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
): { essential: LlmRankedItem[]; surprise: LlmRankedItem[]; guardDowngrades: number } {
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
  const droppedFromSurprise = surprise.filter((item) => isFarClaim(item))
  const keptSurprise = surprise.filter((item) => !isFarClaim(item))

  return {
    essential: keptEssential,
    surprise: [...keptSurprise, ...downgraded],
    guardDowngrades: downgraded.length + droppedFromSurprise.length,
  }
}

/**
 * Retire les N articles les moins scores (par q1) pour laisser la place
 * aux carry-overs. Retourne essential et surprise reduits, re-rankes.
 */
export function integrateCarryOvers(
  essential: RankedItem[],
  surprise: RankedItem[],
  numCarryOvers: number
): { essential: RankedItem[]; surprise: RankedItem[] } {
  if (numCarryOvers === 0) return { essential, surprise }
  const allComposed = [...essential, ...surprise]
  const numToReplace = Math.min(numCarryOvers, allComposed.length)
  if (numToReplace === 0) return { essential, surprise }

  const toDropIds = new Set(
    [...allComposed]
      .sort((a, b) => a.q1 - b.q1)
      .slice(0, numToReplace)
      .map((r) => r.itemId)
  )

  const newEssential = essential
    .filter((r) => !toDropIds.has(r.itemId))
    .map((item, i) => ({ ...item, rank: i + 1 }))
  const newSurprise = surprise
    .filter((r) => !toDropIds.has(r.itemId))
    .map((item, i) => ({ ...item, rank: i + 1 }))

  return { essential: newEssential, surprise: newSurprise }
}

/**
 * Compose l'edition finale avec plancher 5 / plafond 8 et ratio essentiel/surprise 75/25.
 * Si moins de 5 articles qualifiants (Q1 >= MIN_Q1_RELEVANCE), repêche par Q1
 * desc parmi les items LLM sous le seuil et les flagge below_normal_threshold.
 *
 * Le parametre rssRatio gouverne le split des slots essentiels entre items
 * RSS et items de decouverte agent. Overflow : si un bucket manque de stock,
 * l'autre absorbe les slots libres. Le bucket surprise n'est pas contraint
 * par rssRatio (is_serendipity est orthogonal a source_kind).
 */
export type ComposeEditionOpts = {
  minCount?: number
  maxCount?: number
  essentialRatio?: number
  rssRatio?: number
}

export function composeEdition(
  essential: LlmRankedItem[],
  surprise: LlmRankedItem[],
  candidates: RankingCandidate[],
  opts: ComposeEditionOpts = {}
): { essential: RankedItem[]; surprise: RankedItem[] } {
  const minCount = opts.minCount ?? 5
  const maxCount = opts.maxCount ?? 8
  const essentialRatio = opts.essentialRatio ?? 0.75
  const rssRatio = opts.rssRatio ?? 1
  const qEssential = enforceMinRelevance(essential)
  const qSurprise = enforceMinRelevance(surprise)
  const qualifying = qEssential.length + qSurprise.length

  const target = Math.max(minCount, Math.min(maxCount, qualifying))
  const targetEssential = Math.ceil(target * essentialRatio)

  const kindById = new Map(candidates.map((c) => [c.itemId, c.sourceKind]))
  const kindOf = (itemId: string): 'rss' | 'agent' => kindById.get(itemId) ?? 'rss'

  // Split essential par source_kind selon rssRatio. Si le pool d'un kind est
  // insuffisant, les slots libres basculent sur l'autre kind (overflow).
  const targetEssentialRss = Math.round(targetEssential * rssRatio)
  const targetEssentialAgent = targetEssential - targetEssentialRss

  const qERss = qEssential.filter((i) => kindOf(i.item_id) === 'rss')
  const qEAgent = qEssential.filter((i) => kindOf(i.item_id) === 'agent')

  const pickedRss = qERss.slice(0, targetEssentialRss)
  const pickedAgent = qEAgent.slice(0, targetEssentialAgent)

  const deficitRss = targetEssentialRss - pickedRss.length
  const deficitAgent = targetEssentialAgent - pickedAgent.length
  const overflowFromAgent =
    deficitRss > 0 ? qEAgent.slice(pickedAgent.length, pickedAgent.length + deficitRss) : []
  const overflowFromRss =
    deficitAgent > 0 ? qERss.slice(pickedRss.length, pickedRss.length + deficitAgent) : []

  const pickedIds = new Set([
    ...pickedRss.map((i) => i.item_id),
    ...pickedAgent.map((i) => i.item_id),
    ...overflowFromAgent.map((i) => i.item_id),
    ...overflowFromRss.map((i) => i.item_id),
  ])
  // Preserve l'ordre LLM original dans l'edition finale.
  const essentialOrdered = qEssential.filter((i) => pickedIds.has(i.item_id))
  const takenQE = essentialOrdered.length

  // Les slots essential non remplis sont cedés à surprise avant repêche.
  const remainingAfterEssential = target - takenQE
  const takenQS = Math.min(remainingAfterEssential, qSurprise.length)
  const remaining = target - takenQE - takenQS

  const essentialItems: RankedItem[] = essentialOrdered.map((item, i) => ({
    itemId: item.item_id,
    q1: item.q1,
    q2: item.q2,
    q3: item.q3,
    justification: item.justification,
    bucket: 'essential' as const,
    rank: i + 1,
    belowNormalThreshold: false,
    sourceKind: kindOf(item.item_id),
  }))

  const surpriseItems: RankedItem[] = qSurprise.slice(0, takenQS).map((item, i) => ({
    itemId: item.item_id,
    q1: item.q1,
    q2: item.q2,
    q3: item.q3,
    justification: item.justification,
    bucket: 'surprise' as const,
    rank: i + 1,
    belowNormalThreshold: false,
    sourceKind: kindOf(item.item_id),
  }))

  if (remaining > 0) {
    const usedIds = new Set([...essentialItems, ...surpriseItems].map((r) => r.itemId))
    const repechPool = [...essential, ...surprise]
      .filter((item) => item.q1 < MIN_Q1_RELEVANCE && !usedIds.has(item.item_id))
      .sort((a, b) => b.q1 - a.q1)
      .slice(0, remaining)

    const essentialDeficit = targetEssential - takenQE
    const repecheE = repechPool.slice(0, essentialDeficit)
    const repecheS = repechPool.slice(essentialDeficit)

    repecheE.forEach((item) => {
      essentialItems.push({
        itemId: item.item_id,
        q1: item.q1,
        q2: item.q2,
        q3: item.q3,
        justification: item.justification,
        bucket: 'essential',
        rank: essentialItems.length + 1,
        belowNormalThreshold: true,
        sourceKind: kindOf(item.item_id),
      })
    })

    repecheS.forEach((item) => {
      surpriseItems.push({
        itemId: item.item_id,
        q1: item.q1,
        q2: item.q2,
        q3: item.q3,
        justification: item.justification,
        bucket: 'surprise',
        rank: surpriseItems.length + 1,
        belowNormalThreshold: true,
        sourceKind: kindOf(item.item_id),
      })
    })

    essentialItems.forEach((item, i) => {
      item.rank = i + 1
    })
    surpriseItems.forEach((item, i) => {
      item.rank = i + 1
    })
  }

  return { essential: essentialItems, surprise: surpriseItems }
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
      .in('status', ['not_interested', 'rejected'])
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
  preferredLanguage: 'fr' | 'en' | undefined
  discoveryMode: DiscoveryMode
  dailyCap: number
  coldStart: boolean
  pinned: string[]
  pinnedFeedIds: string[]
  pinnedFeedNames: string[]
}> {
  const [profileTextResult, profileResult] = await Promise.all([
    supabase
      .from('user_profile_text')
      .select('static_profile, long_term_profile, short_term_profile')
      .eq('user_id', userId)
      .single(),
    supabase
      .from('profiles')
      .select(
        'profile_text, sector, interests, pinned_sources, embedding, profile_structured, discovery_mode, daily_cap'
      )
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

  // profile_structured.language pilote le biais locale du prefilter.
  // 'fr' | 'en' => bias 90/10 ; 'both' ou absent => pas de biais.
  const structured = p?.profile_structured as Record<string, unknown> | null
  const langValue = structured?.language
  const preferredLanguage: 'fr' | 'en' | undefined =
    langValue === 'fr' || langValue === 'en' ? langValue : undefined

  const pinned = (p?.pinned_sources as string[] | null | undefined) ?? []
  const interestsList = interests ?? []
  // Cold start : profil vide de tout signal exploitable par l'agent.
  // Dans ce cas, on force rssRatio = 1 pour que le ranker reste cantonne aux RSS.
  const coldStart =
    interestsList.length === 0 && pinned.length === 0 && !(p?.profile_text && p.profile_text.trim())

  // Resolution pinned URLs -> feed IDs. Les pinned_sources sont des URLs de site
  // (ex: https://www.nrf.fr), feeds.url sont des URLs de flux (ex: https://www.nrf.fr/feed/).
  // On match en extrayant le host de chaque pinned URL et en cherchant les feeds
  // dont l'URL contient ce host.
  let pinnedFeedIds: string[] = []
  let pinnedFeedNames: string[] = []
  if (pinned.length > 0) {
    const pinnedHosts = pinned.map((u) => {
      try { return new URL(u).hostname.replace(/^www\./, '') } catch { return '' }
    }).filter(Boolean)

    if (pinnedHosts.length > 0) {
      const { data: matchedFeeds } = await supabase
        .from('feeds')
        .select('id, site_name')
        .or(pinnedHosts.map((h) => `url.ilike.%${h}%`).join(','))

      pinnedFeedIds = (matchedFeeds ?? []).map((f) => f.id)
      pinnedFeedNames = (matchedFeeds ?? []).map((f) => f.site_name).filter(Boolean) as string[]
    }
  }

  return {
    staticProfile: pt?.static_profile ?? null,
    longTermProfile: pt?.long_term_profile ?? null,
    shortTermProfile: pt?.short_term_profile ?? null,
    fallbackText: fallbackParts.length > 0 ? fallbackParts.join('. ') : null,
    embedding,
    preferredLanguage,
    discoveryMode: (p?.discovery_mode as DiscoveryMode | null) ?? 'active',
    dailyCap: p?.daily_cap ?? 8,
    coldStart,
    pinned,
    pinnedFeedIds,
    pinnedFeedNames,
  }
}

async function countRelevantRss(
  supabase: ServiceClient,
  userId: string,
  embedding: number[]
): Promise<number> {
  const { data, error } = await supabase.rpc('count_relevant_rss', {
    target_user_id: userId,
    user_embedding: JSON.stringify(embedding),
    distance_max: RSS_RELEVANCE_DISTANCE_MAX,
  })
  if (error || typeof data !== 'number') return 0
  return data
}

async function loadCarryOverCandidates(
  supabase: ServiceClient,
  userId: string,
  todayStart: string
): Promise<CarryOverArticle[]> {
  const { data } = await supabase
    .from('articles')
    .select('id, item_id, score, justification, is_serendipity')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .eq('carry_over_count', 0)
    .not('last_shown_in_edition_at', 'is', null)
    .lt('last_shown_in_edition_at', todayStart)
    .order('score', { ascending: false })
    .limit(2)
  return (data ?? []).filter((r): r is CarryOverArticle => r.item_id !== null)
}

async function callRankingLlm(
  profilePrompt: ReturnType<typeof buildRankingUserPrompt>,
  modelId: string,
  userId: string,
  locale: RankingLocale
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
    systemInstruction: getRankingSystemPrompt(locale),
    generationConfig: {
      responseMimeType: 'application/json',
      maxOutputTokens: 4096,
      // @ts-expect-error - thinkingConfig not typed in SDK
      thinkingConfig: { thinkingBudget: 0 },
    },
  })

  const result = await model.generateContent(profilePrompt.prompt)
  const text = result.response.text()
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Aucun JSON dans la reponse')

  const raw = JSON.parse(match[0]) as LlmRawResponse
  const { logError } = await import('@/lib/errors/log-error')

  const { items: essential, invalidIndices: essentialInvalid } = resolveIndexedItems(
    raw.essential ?? [],
    profilePrompt.indexMap
  )
  const { items: surprise, invalidIndices: surpriseInvalid } = resolveIndexedItems(
    raw.surprise ?? [],
    profilePrompt.indexMap
  )

  for (const idx of [...essentialInvalid, ...surpriseInvalid]) {
    void logError({
      route: 'callRankingLlm.invalid_index',
      error: new Error(`Index inconnu: ${idx}`),
      userId,
      context: { item_id: idx },
    })
  }

  await recordProviderCall('gemini')
  await recordUserProviderCall('gemini', userId)
  return { essential, surprise }
}

function cosineFallback(
  candidates: RankingCandidate[],
  locale: RankingLocale = 'fr'
): {
  essential: RankedItem[]
  surprise: RankedItem[]
} {
  const essentialLabel =
    locale === 'en' ? 'Automatic ranking (cosine)' : 'Classement automatique (cosine)'
  const surpriseLabel =
    locale === 'en' ? 'Automatic discovery (rare)' : 'Decouverte automatique (rarete)'

  // Sort by cosine distance (closest = most relevant)
  const sorted = [...candidates].sort((a, b) => a.distance - b.distance)

  const essential: RankedItem[] = sorted.slice(0, 5).map((c, i) => ({
    itemId: c.itemId,
    q1: 10 - i,
    q2: 5,
    q3: 5,
    justification: essentialLabel,
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
    justification: surpriseLabel,
    bucket: 'surprise' as const,
    rank: i + 1,
  }))

  return { essential, surprise }
}

export async function persistRanking(
  supabase: ServiceClient,
  userId: string,
  date: string,
  essential: RankedItem[],
  surprise: RankedItem[],
  candidates: RankingCandidate[]
): Promise<void> {
  const allRanked = [...essential, ...surprise]
  const candidateMap = new Map(candidates.map((c) => [c.itemId, c]))

  const { logError } = await import('@/lib/errors/log-error')
  console.info(`Persisting ${allRanked.length} items for user ${userId}`)

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
      await logError({ route: 'persistRanking.daily_ranking', error: rankingError, userId })
    }
  }

  // Promote to articles table, then enrich with full content via Readability.
  // Parsing en parallele (fetch deja protege par timeout 10s dans fetcher.ts).
  const settled = await Promise.allSettled(
    allRanked.map(async (item) => {
      const candidate = candidateMap.get(item.itemId)
      if (!candidate) {
        await logError({
          route: 'persistRanking.articles.missing_candidate',
          error: new Error(`Candidate introuvable pour item_id: ${item.itemId}`),
          userId,
          context: { item_id: item.itemId },
        })
        return
      }

      const now = new Date().toISOString()
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
        status: 'pending',
        origin: 'agent',
        scored_at: now,
        last_shown_in_edition_at: now,
        below_normal_threshold: item.belowNormalThreshold ?? false,
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

      // Upsert sur (user_id, url) : l'index unique idx_articles_user_url est non-partial,
      // contrairement à l'index sur item_id. Le delete précédent ne couvrait pas le cas
      // où la même URL existait avec un item_id différent → code 23505 (unique_violation).
      const { error: upsertError } = await supabase
        .from('articles')
        .upsert(articleRow, { onConflict: 'user_id,url' })
      if (upsertError) {
        await logError({
          route: 'persistRanking.articles.insert',
          error: upsertError,
          userId,
          context: { item_id: item.itemId, code: upsertError.code, details: upsertError.details },
        })
      }
    })
  )

  for (const [i, result] of settled.entries()) {
    if (result.status === 'rejected') {
      const item = allRanked[i]
      await logError({
        route: 'persistRanking.articles',
        error: result.reason,
        userId,
        context: { item_id: item?.itemId },
      })
    }
  }

  // Efface first_edition_empty si l'édition est non vide.
  // Déclenché par le cron quotidien pour les users dont la première édition était vide.
  if (allRanked.length > 0) {
    await supabase.from('profiles').update({ first_edition_empty: false }).eq('id', userId)
  }
}

export async function rankForUser(supabase: ServiceClient, userId: string): Promise<RankingResult> {
  const start = Date.now()
  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const todayStart = new Date(now)
  todayStart.setUTCHours(0, 0, 0, 0)
  const todayStartISO = todayStart.toISOString()

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
      editionSize: 0,
      error: "Deja classe aujourd'hui",
      durationMs: Date.now() - start,
      cosineP25: null,
      cosineP50: null,
      cosineP75: null,
      guardDowngrades: 0,
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
      editionSize: 0,
      error: "Pas d'embedding profil disponible",
      durationMs: Date.now() - start,
      cosineP25: null,
      cosineP50: null,
      cosineP75: null,
      guardDowngrades: 0,
    }
  }

  const [candidates, recentSignals, rssAvailable] = await Promise.all([
    prefilterCandidates(supabase, userId, profile.embedding, undefined, profile.preferredLanguage, MIN_WORD_COUNT, profile.pinnedFeedIds),
    loadRecentSignals(supabase, userId),
    countRelevantRss(supabase, userId, profile.embedding),
  ])

  // Ponderation adaptative : ratio de slots essentiels reserves aux items RSS.
  // Depend du mode de decouverte, de la taille du pool RSS pertinent et du cold start.
  const rssRatio = resolveRssRatio({
    rssAvailable,
    dailyCap: profile.dailyCap,
    mode: profile.discoveryMode,
    coldStart: profile.coldStart,
  })

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
      editionSize: 0,
      error: 'Aucun candidat disponible',
      durationMs: Date.now() - start,
      cosineP25: null,
      cosineP50: null,
      cosineP75: null,
      guardDowngrades: 0,
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
    recentSignals,
    profile.pinnedFeedNames
  )

  let essential: RankedItem[] = []
  let surprise: RankedItem[] = []
  let fallback = false
  let modelUsed: string | null = null
  let rankError: string | null = null
  let guardDowngrades = 0

  // Locale de la justification : 'en' si le lecteur a choisi l'anglais,
  // sinon francais (valeur par defaut, couvre 'fr' et 'both').
  const justificationLocale: RankingLocale = profile.preferredLanguage === 'en' ? 'en' : 'fr'

  try {
    // Try primary model first, fallback to secondary
    let llmResult: LlmResponse
    try {
      llmResult = await callRankingLlm(userPrompt, MODEL, userId, justificationLocale)
      modelUsed = MODEL
    } catch (primaryErr) {
      // Log explicite si le modele primaire est decommisionne (404) ou en erreur
      const { logError } = await import('@/lib/errors/log-error')
      await logError({ route: 'rankForUser.callRankingLlm', error: primaryErr, userId })
      llmResult = await callRankingLlm(userPrompt, FALLBACK_MODEL, userId, justificationLocale)
      modelUsed = FALLBACK_MODEL
    }

    // Garde-fou 1 : Q1 >= 7 avec distance cosine > 0.6 = incoherence LLM/embedding,
    // downgrade dans surprise ou drop si deja en surprise (scenario Dezeen/Politique).
    // enforceMinRelevance est applique en interne par composeEdition.
    const guarded = applyCosineGuard(
      llmResult.essential ?? [],
      llmResult.surprise ?? [],
      candidates
    )
    guardDowngrades = guarded.guardDowngrades

    const composed = composeEdition(guarded.essential, guarded.surprise, candidates, { rssRatio })
    essential = composed.essential
    surprise = composed.surprise
  } catch (err) {
    // Complete LLM failure : cosine fallback
    rankError = err instanceof Error ? err.message : String(err)
    fallback = true
    modelUsed = 'cosine_fallback'
    const fb = cosineFallback(candidates, justificationLocale)
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

  // Carry-over : integrer les articles pending d'hier dans l'edition du jour.
  // Les carry-overs remplacent les moins bons items composes (meme quota total).
  const carryOvers = await loadCarryOverCandidates(supabase, userId, todayStartISO)
  if (carryOvers.length > 0) {
    const integrated = integrateCarryOvers(essential, surprise, carryOvers.length)
    essential = integrated.essential
    surprise = integrated.surprise

    // UPDATE carry-overs : carry_over_count=1, last_shown_in_edition_at=today
    const nowISO = now.toISOString()
    await Promise.all(
      carryOvers.map((co) =>
        supabase
          .from('articles')
          .update({ carry_over_count: 1, last_shown_in_edition_at: nowISO })
          .eq('user_id', userId)
          .eq('item_id', co.item_id)
      )
    )
  }

  await persistRanking(supabase, userId, today, essential, surprise, candidates)

  // Telemetrie recall : combien de candidates etaient marques keyword_hit, et
  // combien ont atteint essential+surprise. Sert a valider la regle prompt
  // "ne peut pas etre ignore sans Q1 < 6" dans le temps.
  const keywordHitIds = new Set(candidates.filter((c) => c.isKeywordHit).map((c) => c.itemId))
  const promotedIds = new Set([...essential, ...surprise].map((r) => r.itemId))
  const keywordHitsPromoted = [...keywordHitIds].filter((id) => promotedIds.has(id)).length

  // Percentiles cosine sur les distances des candidats (telemetrie pour P0-2).
  const sortedDistances = candidates.map((c) => c.distance).sort((a, b) => a - b)
  const cosineP25 = sortedDistances.length > 0 ? sortedDistances[Math.floor(sortedDistances.length * 0.25)] ?? null : null
  const cosineP50 = sortedDistances.length > 0 ? sortedDistances[Math.floor(sortedDistances.length * 0.5)] ?? null : null
  const cosineP75 = sortedDistances.length > 0 ? sortedDistances[Math.floor(sortedDistances.length * 0.75)] ?? null : null

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
    editionSize: essential.length + surprise.length,
    error: rankError,
    durationMs: Date.now() - start,
    cosineP25,
    cosineP50,
    cosineP75,
    guardDowngrades: fallback ? 0 : guardDowngrades,
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
          edition_size: r.editionSize,
          duration_ms: r.durationMs,
          error: r.error,
          keyword_hits_count: r.keywordHitsCount,
          keyword_hits_promoted: r.keywordHitsPromoted,
          keyword_hits_force_injected: r.keywordHitsForceInjected,
          cosine_p25: r.cosineP25,
          cosine_p50: r.cosineP50,
          cosine_p75: r.cosineP75,
          guard_downgrades_count: r.guardDowngrades,
        }))
      )
      .then(({ error }) => {
        if (error) console.error('[ranking] ranking_runs insert failed', error.message)
      })
  }

  return results
}

/**
 * Ranking pour un seul user (admin rerank, debug).
 * Le caller fournit le client Supabase service_role et s'occupe du bypass
 * du check "deja classe aujourd'hui" (suppression daily_ranking).
 * Insere la telemetry dans ranking_runs.
 */
export async function runRankingForUser(
  supabase: ServiceClient,
  userId: string
): Promise<RankingResult> {
  const result = await rankForUser(supabase, userId)

  await supabase
    .from('ranking_runs')
    .insert({
      user_id: result.userId,
      date: result.date,
      model_used: result.modelUsed,
      fallback: result.fallback,
      candidates_count: result.candidatesCount,
      essential_count: result.essential.length,
      surprise_count: result.surprise.length,
      edition_size: result.editionSize,
      duration_ms: result.durationMs,
      error: result.error,
      keyword_hits_count: result.keywordHitsCount,
      keyword_hits_promoted: result.keywordHitsPromoted,
      keyword_hits_force_injected: result.keywordHitsForceInjected,
      cosine_p25: result.cosineP25,
      cosine_p50: result.cosineP50,
      cosine_p75: result.cosineP75,
      guard_downgrades_count: result.guardDowngrades,
    })
    .then(({ error }) => {
      if (error) console.error('[ranking] ranking_runs insert failed', error.message)
    })

  return result
}
