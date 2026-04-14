// Client Voyage AI pour la génération d'embeddings (ADR-001)
// Appel HTTP direct sans SDK pour éviter une dépendance supplémentaire

const VOYAGE_API_URL = 'https://api.voyageai.com/v1/embeddings'
const VOYAGE_MODEL = 'voyage-3'

export class EmbeddingError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number
  ) {
    super(message)
    this.name = 'EmbeddingError'
  }
}

export class EmbeddingRateLimitError extends EmbeddingError {
  constructor() {
    super('Voyage AI rate limit atteint', 429)
    this.name = 'EmbeddingRateLimitError'
  }
}

type VoyageResponse = {
  data: Array<{ embedding: number[]; index: number }>
  model: string
  usage: { total_tokens: number }
}

// Tronque le texte à 4000 tokens environ (heuristique : 4 chars ≈ 1 token)
function truncate(text: string, maxChars = 16000): string {
  return text.length > maxChars ? text.slice(0, maxChars) : text
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const results = await generateEmbeddingBatch([text])
  return results[0]
}

export async function generateEmbeddingBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return []

  const { assertBudget, recordProviderCall } = await import('@/lib/api-budget')
  assertBudget('voyage')

  const apiKey = process.env.VOYAGE_API_KEY
  if (!apiKey) {
    throw new EmbeddingError('VOYAGE_API_KEY non configurée')
  }

  const inputs = texts.map(truncate)

  const response = await fetch(VOYAGE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: VOYAGE_MODEL,
      input: inputs,
    }),
  })

  if (response.status === 429) {
    throw new EmbeddingRateLimitError()
  }

  if (!response.ok) {
    throw new EmbeddingError(`Voyage AI erreur ${response.status}`, response.status)
  }

  const data: VoyageResponse = (await response.json()) as VoyageResponse
  recordProviderCall('voyage')

  // Retourne les embeddings dans l'ordre original
  return data.data.sort((a, b) => a.index - b.index).map((item) => item.embedding)
}
