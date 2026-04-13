import { GoogleGenerativeAI } from '@google/generative-ai'
import type { ArticleCandidate, ScoringFunctionResult, UserProfile } from './types'
import { buildSystemPrompt, buildUserPrompt } from './prompts'

// gemini-2.5-flash : ~$0.15/1M tokens input, seul modele avec quota actif
const MODEL = 'gemini-2.5-flash'
// Plafond output : 20 articles × ~200 tokens JSON = ~4000 tokens min
const MAX_TOKENS_OUTPUT = 8192

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

export async function scoreWithGemini(
  profile: UserProfile,
  candidates: ArticleCandidate[],
  archivedTags: string[] = [],
  negativeExamples: string[] = []
): Promise<ScoringFunctionResult> {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)
  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction: buildSystemPrompt(),
    generationConfig: {
      responseMimeType: 'application/json',
      maxOutputTokens: MAX_TOKENS_OUTPUT,
      // Desactive le thinking pour les sorties JSON structurees (plus rapide, moins cher)
      // @ts-expect-error - thinkingConfig non encore type dans le SDK
      thinkingConfig: { thinkingBudget: 0 },
    },
  })

  const result = await model.generateContent(
    buildUserPrompt(profile, candidates, archivedTags, negativeExamples)
  )

  const text = result.response.text()
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Gemini: aucun JSON dans la reponse')

  let parsed: ApiResponse
  try {
    parsed = JSON.parse(match[0])
  } catch {
    throw new Error(`Gemini: JSON invalide: ${match[0].slice(0, 100)}`)
  }

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
