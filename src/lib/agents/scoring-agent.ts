import type { ScoredArticle, ScoringRequest, ScoringResult } from './types'
import { scoreWithMessagesApi } from './messages-api'

// Taille max de batch pour eviter les prompts trop longs
const BATCH_SIZE = 10

export async function runScoringAgent(request: ScoringRequest): Promise<ScoringResult> {
  const start = Date.now()
  const { profile, candidates, runId, archivedTags = [], negativeExamples = [] } = request

  let scored: ScoredArticle[] = []
  const agentType: 'managed' | 'messages' = 'messages'
  let error: string | null = null

  try {
    // Traitement par batch si beaucoup de candidats
    const batches = chunk(candidates, BATCH_SIZE)

    for (const batch of batches) {
      const results = await scoreWithMessagesApi(profile, batch, archivedTags, negativeExamples)
      scored = scored.concat(results)
    }
  } catch (err) {
    error = err instanceof Error ? err.message : String(err)
    // En cas d'erreur totale, on retourne un tableau vide (le run est marque en erreur)
  }

  return {
    runId,
    scored,
    agentType,
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
