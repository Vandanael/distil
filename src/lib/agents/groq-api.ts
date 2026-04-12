import Groq from 'groq-sdk'
import type { ArticleCandidate, ScoredArticle, UserProfile } from './types'
import { buildSystemPrompt, buildUserPrompt } from './prompts'

const MODEL = 'llama-3.1-70b-versatile'

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

export async function scoreWithGroq(
  profile: UserProfile,
  candidates: ArticleCandidate[],
  archivedTags: string[] = [],
  negativeExamples: string[] = []
): Promise<ScoredArticle[]> {
  const client = new Groq({ apiKey: process.env.GROQ_API_KEY })

  const completion = await client.chat.completions.create({
    model: MODEL,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: buildSystemPrompt() },
      { role: 'user', content: buildUserPrompt(profile, candidates, archivedTags, negativeExamples) },
    ],
    max_tokens: 4096,
  })

  const text = completion.choices[0]?.message?.content ?? ''
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Groq: aucun JSON dans la reponse')

  const parsed: ApiResponse = JSON.parse(match[0])

  return parsed.scored.map((item) => ({
    url: item.url,
    score: item.score,
    justification: item.justification,
    isSerendipity: item.is_serendipity,
    rejectionReason: item.rejection_reason,
    accepted: item.accepted,
  }))
}
