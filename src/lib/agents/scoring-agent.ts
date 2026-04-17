import type { ScoredArticle, ScoringRequest, ScoringResult } from './types'
import { scoreWithMessagesApi } from './messages-api'
import { PROMPT_VERSION } from './prompts'

// Taille max de batch pour eviter les prompts trop longs
const BATCH_SIZE = 10

export async function runScoringAgent(request: ScoringRequest): Promise<ScoringResult> {
  const start = Date.now()
  const { profile, candidates, runId, userId, archivedTags = [], negativeExamples = [] } = request

  let scored: ScoredArticle[] = []
  const agentType = 'messages' as const
  let modelUsed: string | null = null
  let error: string | null = null

  try {
    // Traitement par batch si beaucoup de candidats
    const batches = chunk(candidates, BATCH_SIZE)

    for (const batch of batches) {
      const batchResult = await scoreWithMessagesApi(
        profile,
        batch,
        archivedTags,
        negativeExamples,
        userId
      )
      scored = scored.concat(batchResult.scored)
      if (!modelUsed) modelUsed = batchResult.modelUsed
    }
  } catch (err) {
    error = err instanceof Error ? err.message : String(err)
    // En cas d'erreur totale, on retourne un tableau vide (le run est marque en erreur)
  }

  return {
    runId,
    scored,
    agentType,
    modelUsed,
    promptVersion: PROMPT_VERSION,
    durationMs: Date.now() - start,
    error,
  }
}

function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size))
  }
  return result
}
