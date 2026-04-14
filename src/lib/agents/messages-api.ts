import Anthropic from '@anthropic-ai/sdk'
import type { ArticleCandidate, ScoringFunctionResult, UserProfile } from './types'
import { buildSystemPrompt, buildUserPrompt } from './prompts'
import { scoreWithGroq } from './groq-api'
import { scoreWithGemini } from './gemini-api'

const MODEL = 'claude-haiku-4-5-20251001'

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

export async function scoreWithMessagesApi(
  profile: UserProfile,
  candidates: ArticleCandidate[],
  archivedTags: string[] = [],
  negativeExamples: string[] = []
): Promise<ScoringFunctionResult> {
  // Groq (gratuit, 14k req/jour, Llama 3.1 70B)
  if (process.env.GROQ_API_KEY) {
    return scoreWithGroq(profile, candidates, archivedTags, negativeExamples)
  }

  // Gemini Flash (gratuit avec billing activé)
  if (process.env.GOOGLE_AI_API_KEY) {
    return scoreWithGemini(profile, candidates, archivedTags, negativeExamples)
  }

  // Fallback : Anthropic Haiku
  const { assertBudget, recordProviderCall } = await import('@/lib/api-budget')
  assertBudget('anthropic')

  const client = new Anthropic()

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: buildSystemPrompt(),
    messages: [
      {
        role: 'user',
        content: buildUserPrompt(profile, candidates, archivedTags, negativeExamples),
      },
    ],
  })

  const text = message.content.find((b) => b.type === 'text')?.text ?? ''
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Messages API: aucun JSON dans la reponse')

  let parsed: ApiResponse
  try {
    parsed = JSON.parse(match[0])
  } catch {
    throw new Error(`Messages API: JSON invalide: ${match[0].slice(0, 100)}`)
  }

  recordProviderCall('anthropic')

  return {
    scored: parsed.scored.map((item) => ({
      url: item.url,
      score: item.score,
      justification: item.justification,
      isSerendipity: item.is_serendipity,
      rejectionReason: item.rejection_reason,
      accepted: item.accepted,
    })),
    modelUsed: MODEL,
  }
}
