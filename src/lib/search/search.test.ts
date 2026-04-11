import { describe, it, expect, vi, beforeEach } from 'vitest'
import { searchFullText, searchSemantic } from './search'
import { EmbeddingError, EmbeddingRateLimitError } from '@/lib/embeddings/voyage'

// Mock du client Supabase server
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

// Mock du module voyage
vi.mock('@/lib/embeddings/voyage', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/embeddings/voyage')>()
  return {
    ...actual,
    generateEmbedding: vi.fn(),
  }
})

import { createClient } from '@/lib/supabase/server'
import { generateEmbedding } from '@/lib/embeddings/voyage'

const mockArticles = [
  { id: 'a1', title: 'Article IA', excerpt: 'Contenu sur l IA', site_name: 'Le Monde', score: 0.8 },
  { id: 'a2', title: 'Article Data', excerpt: 'Contenu sur la data', site_name: 'Wired', score: 0.6 },
]

function makeSupabaseMock(data: unknown, error: unknown = null) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    textSearch: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data, error }),
    rpc: vi.fn().mockResolvedValue({ data, error }),
  }
  // from() retourne la même chaîne pour permettre les appels chaînés
  chain.from = vi.fn().mockReturnValue(chain)
  return chain
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('searchFullText', () => {
  it('retourne les articles correspondants', async () => {
    const mock = makeSupabaseMock(mockArticles)
    vi.mocked(createClient).mockResolvedValue(mock as unknown as ReturnType<typeof createClient> extends Promise<infer T> ? T : never)

    const results = await searchFullText('user-1', 'intelligence artificielle')

    expect(results).toHaveLength(2)
    expect(results[0].matchType).toBe('fulltext')
    expect(results[0].id).toBe('a1')
  })

  it('retourne un tableau vide si query vide', async () => {
    const results = await searchFullText('user-1', '  ')
    expect(results).toEqual([])
    expect(createClient).not.toHaveBeenCalled()
  })

  it('retourne un tableau vide si Supabase retourne null', async () => {
    const mock = makeSupabaseMock(null)
    vi.mocked(createClient).mockResolvedValue(mock as unknown as ReturnType<typeof createClient> extends Promise<infer T> ? T : never)

    const results = await searchFullText('user-1', 'test')
    expect(results).toEqual([])
  })

  it('lance une erreur si Supabase échoue', async () => {
    const mock = makeSupabaseMock(null, { message: 'connexion perdue' })
    vi.mocked(createClient).mockResolvedValue(mock as unknown as ReturnType<typeof createClient> extends Promise<infer T> ? T : never)

    await expect(searchFullText('user-1', 'test')).rejects.toThrow('Recherche full-text échouée')
  })
})

describe('searchSemantic', () => {
  it('retourne un tableau vide si query vide', async () => {
    const results = await searchSemantic('user-1', '')
    expect(results).toEqual([])
  })

  it('retourne les résultats avec matchType semantic', async () => {
    const semanticData = mockArticles.map((a) => ({ ...a, similarity: 0.9 }))
    const mock = { rpc: vi.fn().mockResolvedValue({ data: semanticData, error: null }) }
    vi.mocked(createClient).mockResolvedValue(mock as unknown as ReturnType<typeof createClient> extends Promise<infer T> ? T : never)
    vi.mocked(generateEmbedding).mockResolvedValue(Array(1024).fill(0.1))

    const results = await searchSemantic('user-1', 'intelligence')

    expect(results).toHaveLength(2)
    expect(results[0].matchType).toBe('semantic')
    expect(results[0].similarity).toBe(0.9)
  })

  it('retombe sur full-text si Voyage lance EmbeddingError', async () => {
    vi.mocked(generateEmbedding).mockRejectedValue(new EmbeddingError('VOYAGE_API_KEY non configurée'))

    // Le fallback appelle searchFullText, qui utilise .from()
    const mock = makeSupabaseMock(mockArticles)
    vi.mocked(createClient).mockResolvedValue(mock as unknown as ReturnType<typeof createClient> extends Promise<infer T> ? T : never)

    const results = await searchSemantic('user-1', 'test fallback')

    expect(results[0].matchType).toBe('fulltext')
    expect(mock.from).toHaveBeenCalled()
  })

  it('retombe sur full-text si Voyage lance EmbeddingRateLimitError', async () => {
    vi.mocked(generateEmbedding).mockRejectedValue(new EmbeddingRateLimitError())

    // Le fallback appelle searchFullText, qui utilise .from()
    const mock = makeSupabaseMock(mockArticles)
    vi.mocked(createClient).mockResolvedValue(mock as unknown as ReturnType<typeof createClient> extends Promise<infer T> ? T : never)

    const results = await searchSemantic('user-1', 'test rate limit')

    expect(results[0].matchType).toBe('fulltext')
    expect(mock.from).toHaveBeenCalled()
  })

  it('les résultats sémantiques sont triés par similarité décroissante (côté Postgres)', async () => {
    // La fonction RPC trie par ORDER BY embedding <=> query_embedding (cosinus),
    // on vérifie que le client retourne les données dans l'ordre reçu de Supabase
    const semanticData = [
      { ...mockArticles[0], similarity: 0.95 },
      { ...mockArticles[1], similarity: 0.78 },
    ]
    const mock = { rpc: vi.fn().mockResolvedValue({ data: semanticData, error: null }) }
    vi.mocked(createClient).mockResolvedValue(mock as unknown as ReturnType<typeof createClient> extends Promise<infer T> ? T : never)
    vi.mocked(generateEmbedding).mockResolvedValue(Array(1024).fill(0.1))

    const results = await searchSemantic('user-1', 'ia')

    expect(results[0].similarity).toBeGreaterThan(results[1].similarity!)
  })
})
