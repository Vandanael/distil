import type { ServiceClient } from '@/lib/supabase/types'
import type { RankingCandidate } from './ranking-types'

const DEFAULT_LIMIT = 40
const LOOKBACK_HOURS = 48

/**
 * Pre-filter items by cosine similarity to user profile embedding.
 * Returns top N candidates from the last 48h that the user hasn't seen yet.
 *
 * preferredLanguage biaise le pool cosine 90/10 vers la langue demandee ('fr' | 'en').
 * 'both' ou undefined desactive le biais (comportement historique).
 */
export async function prefilterCandidates(
  supabase: ServiceClient,
  userId: string,
  profileEmbedding: number[],
  limit: number = DEFAULT_LIMIT,
  preferredLanguage?: 'fr' | 'en'
): Promise<RankingCandidate[]> {
  const cutoff = new Date(Date.now() - LOOKBACK_HOURS * 60 * 60 * 1000).toISOString()

  // Use RPC for cosine-based pre-filtering
  const { data, error } = await supabase.rpc('prefilter_ranking_candidates', {
    user_embedding: JSON.stringify(profileEmbedding),
    target_user_id: userId,
    cutoff_time: cutoff,
    max_count: limit,
    preferred_language: preferredLanguage ?? null,
  })

  if (error || !data) {
    // Fallback : basic query without cosine ordering (degrades quality but works)
    const { data: fallbackData } = await supabase
      .from('items')
      .select('id, url, title, author, published_at, content_text, word_count')
      .gte('fetched_at', cutoff)
      .order('fetched_at', { ascending: false })
      .limit(limit)

    if (!fallbackData) return []

    return fallbackData.map((item) => ({
      itemId: item.id,
      url: item.url,
      title: item.title,
      author: item.author,
      siteName: null,
      publishedAt: item.published_at,
      contentPreview: (item.content_text ?? '').slice(0, 500),
      wordCount: item.word_count ?? 0,
      distance: 1.0,
      unpopScore: 0.5,
      isKeywordHit: false,
      matchedKeywords: [],
      keywordRank: 0,
      sourceKind: 'rss',
    }))
  }

  return (data as Array<Record<string, unknown>>).map((row) => ({
    itemId: row.item_id as string,
    url: row.url as string,
    title: (row.title as string | null) ?? null,
    author: (row.author as string | null) ?? null,
    siteName: (row.site_name as string | null) ?? null,
    publishedAt: (row.published_at as string | null) ?? null,
    contentPreview: ((row.content_text as string) ?? '').slice(0, 500),
    wordCount: (row.word_count as number) ?? 0,
    distance: row.distance as number,
    unpopScore: (row.unpop_score as number) ?? 0.5,
    isKeywordHit: Boolean(row.is_keyword_hit),
    matchedKeywords: Array.isArray(row.matched_keywords) ? (row.matched_keywords as string[]) : [],
    keywordRank: typeof row.keyword_rank === 'number' ? row.keyword_rank : 0,
    sourceKind: row.source_kind === 'agent' ? 'agent' : 'rss',
  }))
}
