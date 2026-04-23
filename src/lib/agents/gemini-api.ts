import { GoogleGenerativeAI } from '@google/generative-ai'
import type { ArticleCandidate, ScoringFunctionResult, UserProfile } from './types'
import { buildSystemPrompt, buildUserPrompt } from './prompts'

// Chaine de modeles : si gemini-2.5-flash renvoie 503/429 (capacite saturee),
// on bascule sur gemini-flash-latest (alias dynamique Google).
const MODELS = ['gemini-2.5-flash', 'gemini-flash-latest'] as const
// 16k : un batch de 10 avec justifications verbeuses peut depasser 8k
const MAX_TOKENS_OUTPUT = 16384
const RETRY_BACKOFF_MS = [500, 1500]

type ApiResponse = {
  scored: Array<{
    url: string
    score: number
    justification: string
    is_serendipity: boolean
    rejection_reason: string | null
    accepted: boolean
  }>
}

function isTransientError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err)
  return /\[(429|500|502|503|504)\b/.test(msg) || /overloaded|unavailable|high demand/i.test(msg)
}

async function callModel(
  apiKey: string,
  modelId: string,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: modelId,
    systemInstruction: systemPrompt,
    generationConfig: {
      responseMimeType: 'application/json',
      maxOutputTokens: MAX_TOKENS_OUTPUT,
      // @ts-expect-error - thinkingConfig non encore type dans le SDK
      thinkingConfig: { thinkingBudget: 0 },
    },
  })
  const result = await model.generateContent(userPrompt)
  return result.response.text()
}

export async function scoreWithGemini(
  profile: UserProfile,
  candidates: ArticleCandidate[],
  archivedTags: string[] = [],
  negativeExamples: string[] = [],
  userId?: string
): Promise<ScoringFunctionResult> {
  const { assertBudget, assertUserBudget, recordProviderCall, recordUserProviderCall } =
    await import('@/lib/api-budget')
  if (userId) await assertUserBudget('gemini', userId)
  await assertBudget('gemini')

  const apiKey = process.env.GOOGLE_AI_API_KEY
  if (!apiKey) throw new Error('GOOGLE_AI_API_KEY manquante')

  const systemPrompt = buildSystemPrompt()
  const userPrompt = buildUserPrompt(profile, candidates, archivedTags, negativeExamples)

  let text: string | null = null
  let modelUsed: string | null = null
  const errors: string[] = []

  outer: for (const modelId of MODELS) {
    for (let attempt = 0; attempt <= RETRY_BACKOFF_MS.length; attempt++) {
      try {
        text = await callModel(apiKey, modelId, systemPrompt, userPrompt)
        modelUsed = modelId
        break outer
      } catch (err) {
        errors.push(
          `${modelId} attempt ${attempt}: ${err instanceof Error ? err.message : String(err)}`
        )
        if (!isTransientError(err)) break
        const delay = RETRY_BACKOFF_MS[attempt]
        if (delay !== undefined) await new Promise((r) => setTimeout(r, delay))
      }
    }
  }

  if (text === null || modelUsed === null) {
    throw new Error(`Gemini: tous les modeles ont echoue. ${errors.join(' | ')}`)
  }

  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Gemini: aucun JSON dans la reponse')

  let parsed: ApiResponse
  try {
    parsed = JSON.parse(match[0])
  } catch {
    throw new Error(`Gemini: JSON invalide: ${match[0].slice(0, 100)}`)
  }

  await recordProviderCall('gemini')
  if (userId) await recordUserProviderCall('gemini', userId)

  return {
    scored: parsed.scored.map((item) => ({
      url: item.url,
      score: item.score,
      justification: item.justification,
      isSerendipity: item.is_serendipity,
      rejectionReason: item.rejection_reason,
      accepted: item.accepted,
    })),
    modelUsed,
  }
}
