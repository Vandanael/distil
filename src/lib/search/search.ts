import { createClient } from '@/lib/supabase/server'
import { generateEmbedding, EmbeddingError } from '@/lib/embeddings/voyage'

export type SearchResult = {
  id: string
  title: string | null
  excerpt: string | null
  site_name: string | null
  score: number | null
  similarity?: number
  matchType: 'fulltext' | 'semantic'
}

// Recherche full-text via tsvector Postgres (colonne search_vector)
export async function searchFullText(
  userId: string,
  query: string,
  limit = 10
): Promise<SearchResult[]> {
  if (!query.trim()) return []

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('articles')
    .select('id, title, excerpt, site_name, score')
    .eq('user_id', userId)
    .in('status', ['pending', 'read', 'to_read'])
    .textSearch('search_vector', query, { type: 'websearch', config: 'french' })
    .limit(limit)

  if (error) throw new Error(`Recherche full-text échouée : ${error.message}`)

  return (data ?? []).map((row) => ({ ...row, matchType: 'fulltext' as const }))
}

type MatchArticlesRow = {
  id: string
  title: string | null
  excerpt: string | null
  site_name: string | null
  score: number | null
  similarity: number
}

// Recherche sémantique via embedding Voyage AI + RPC match_articles
// Retombe sur full-text si Voyage n'est pas disponible
export async function searchSemantic(
  userId: string,
  query: string,
  limit = 10
): Promise<SearchResult[]> {
  if (!query.trim()) return []

  let embedding: number[]
  try {
    embedding = await generateEmbedding(query, userId)
  } catch (err) {
    if (err instanceof EmbeddingError) {
      // Fallback sur full-text si Voyage indisponible
      return searchFullText(userId, query, limit)
    }
    throw err
  }

  const supabase = await createClient()

  const { data, error } = await supabase.rpc('match_articles', {
    query_embedding: embedding,
    match_user_id: userId,
    match_threshold: 0.7,
    match_count: limit,
  })

  if (error) throw new Error(`Recherche sémantique échouée : ${error.message}`)

  return ((data as MatchArticlesRow[]) ?? []).map((row) => ({
    ...row,
    matchType: 'semantic' as const,
  }))
}
