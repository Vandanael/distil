import type { SupabaseClient } from '@supabase/supabase-js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>

// Cosine distance threshold : items within this distance are considered "similar"
const SIMILARITY_THRESHOLD = 0.15

/**
 * Compute unpopularity score for items that have embeddings but no popularity entry.
 * Based on Tokutake & Okamoto 2024 : rarity as a signal for serendipity.
 * unpop_score = 1 / (1 + similar_count) -- higher means more unique.
 */
export async function computePopularity(supabase: AnySupabaseClient): Promise<number> {
  // Find items with embeddings but no popularity
  const { data: missing } = await supabase
    .from('item_embeddings')
    .select('item_id, embedding')
    .order('created_at', { ascending: false })
    .limit(50)

  if (!missing || missing.length === 0) return 0

  const { data: existing } = await supabase
    .from('item_popularity')
    .select('item_id')
    .in('item_id', missing.map((m) => m.item_id))

  const existingSet = new Set((existing ?? []).map((e) => e.item_id))
  const toCompute = missing.filter((m) => !existingSet.has(m.item_id))

  if (toCompute.length === 0) return 0

  let computed = 0

  for (const item of toCompute) {
    // Count similar items via pgvector cosine distance operator
    const { count } = await supabase
      .rpc('count_similar_items', {
        target_item_id: item.item_id,
        target_embedding: item.embedding,
        distance_threshold: SIMILARITY_THRESHOLD,
      })
      .single()

    // Fallback : if RPC not available, use a simpler approach
    const similarCount = typeof count === 'number' ? count : 0
    const unpopScore = 1.0 / (1 + similarCount)

    await supabase
      .from('item_popularity')
      .upsert({
        item_id: item.item_id,
        similar_count: similarCount,
        unpop_score: unpopScore,
        computed_at: new Date().toISOString(),
      }, { onConflict: 'item_id' })

    computed++
  }

  return computed
}
