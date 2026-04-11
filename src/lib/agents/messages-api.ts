import Anthropic from '@anthropic-ai/sdk'
import type { ArticleCandidate, ScoredArticle, UserProfile } from './types'
import { buildSystemPrompt, buildUserPrompt } from './prompts'

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
): Promise<ScoredArticle[]> {
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

  // Extrait le JSON meme si le modele a ajoute du texte autour
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) {
    throw new Error('Messages API: aucun JSON dans la reponse')
  }

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
