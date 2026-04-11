import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateEmbedding, generateEmbeddingBatch, EmbeddingError, EmbeddingRateLimitError } from './voyage'

const FAKE_EMBEDDING = Array.from({ length: 1024 }, (_, i) => i * 0.001)

function mockFetch(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response)
}

beforeEach(() => {
  process.env.VOYAGE_API_KEY = 'test-key'
  vi.restoreAllMocks()
})

describe('generateEmbeddingBatch', () => {
  it('retourne un tableau vide si input vide', async () => {
    const result = await generateEmbeddingBatch([])
    expect(result).toEqual([])
  })

  it('retourne les embeddings dans l ordre original', async () => {
    const embedding2 = FAKE_EMBEDDING.map((v) => v * 2)
    global.fetch = mockFetch(200, {
      data: [
        { embedding: embedding2, index: 1 },
        { embedding: FAKE_EMBEDDING, index: 0 },
      ],
      model: 'voyage-3',
      usage: { total_tokens: 100 },
    })

    const result = await generateEmbeddingBatch(['texte 1', 'texte 2'])
    expect(result[0]).toEqual(FAKE_EMBEDDING)
    expect(result[1]).toEqual(embedding2)
  })

  it('lance EmbeddingRateLimitError sur HTTP 429', async () => {
    global.fetch = mockFetch(429, {})
    await expect(generateEmbeddingBatch(['test'])).rejects.toThrow(EmbeddingRateLimitError)
  })

  it('lance EmbeddingError sur erreur HTTP non 429', async () => {
    global.fetch = mockFetch(500, {})
    await expect(generateEmbeddingBatch(['test'])).rejects.toThrow(EmbeddingError)
  })

  it('lance EmbeddingError si VOYAGE_API_KEY absente', async () => {
    delete process.env.VOYAGE_API_KEY
    await expect(generateEmbeddingBatch(['test'])).rejects.toThrow(EmbeddingError)
  })
})

describe('generateEmbedding', () => {
  it('retourne le premier embedding du batch', async () => {
    global.fetch = mockFetch(200, {
      data: [{ embedding: FAKE_EMBEDDING, index: 0 }],
      model: 'voyage-3',
      usage: { total_tokens: 50 },
    })

    const result = await generateEmbedding('mon texte')
    expect(result).toEqual(FAKE_EMBEDDING)
    expect(result).toHaveLength(1024)
  })
})
