import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'
import { prefilterCandidates } from './prefilter'
import { RANKING_SYSTEM_PROMPT, buildRankingUserPrompt } from './ranking-prompts'
import { parseUrl } from '@/lib/parsing/readability'
import type { ServiceClient } from '@/lib/supabase/types'
import type { RankedItem, RankingCandidate, RankingResult } from './ranking-types'

const MODEL = 'gemini-3-flash'
const FALLBACK_MODEL = 'gemini-2.5-flash'

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

  return {
    staticProfile: pt?.static_profile ?? null,
    longTermProfile: pt?.long_term_profile ?? null,
    shortTermProfile: pt?.short_term_profile ?? null,
    fallbackText: fallbackParts.length > 0 ? fallbackParts.join('. ') : null,
    embedding: p?.embedding ?? null,
  }
}

async function callRankingLlm(
  profilePrompt: ReturnType<typeof buildRankingUserPrompt>,
  modelId: string
): Promise<LlmResponse> {
  const { assertBudget, recordProviderCall } = await import('@/lib/api-budget')
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

  recordProviderCall('gemini')
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
    q1: 5,
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
    await supabase.from('daily_ranking').upsert(
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
  }

  // Promote to articles table, then enrich with full content via Readability
  for (const item of allRanked) {
    const candidate = candidateMap.get(item.itemId)
    if (!candidate) continue

    const articleRow: Record<string, unknown> = {
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

    // Best-effort : fetch + parse le contenu complet de l'article
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

    await supabase.from('articles').upsert(articleRow, { onConflict: 'user_id,item_id' })
  }
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
      error: "Pas d'embedding profil disponible",
      durationMs: Date.now() - start,
    }
  }

  const candidates = await prefilterCandidates(supabase, userId, profile.embedding)

  if (candidates.length === 0) {
    return {
      userId,
      date: today,
      essential: [],
      surprise: [],
      fallback: false,
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
    candidates
  )

  let essential: RankedItem[] = []
  let surprise: RankedItem[] = []
  let fallback = false
  let rankError: string | null = null

  try {
    // Try primary model first, fallback to secondary
    let llmResult: LlmResponse
    try {
      llmResult = await callRankingLlm(userPrompt, MODEL)
    } catch {
      llmResult = await callRankingLlm(userPrompt, FALLBACK_MODEL)
    }

    essential = (llmResult.essential ?? []).slice(0, 5).map((item, i) => ({
      itemId: item.item_id,
      q1: item.q1,
      q2: item.q2,
      q3: item.q3,
      justification: item.justification,
      bucket: 'essential' as const,
      rank: i + 1,
    }))

    surprise = (llmResult.surprise ?? []).slice(0, 3).map((item, i) => ({
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
    const fb = cosineFallback(candidates)
    essential = fb.essential
    surprise = fb.surprise
  }

  await persistRanking(supabase, userId, today, essential, surprise, candidates)

  return {
    userId,
    date: today,
    essential,
    surprise,
    fallback,
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

  const results: RankingResult[] = []
  for (const profile of profiles) {
    const result = await rankForUser(supabase, profile.id)
    results.push(result)
  }

  return results
}
