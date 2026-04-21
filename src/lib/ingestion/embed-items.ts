import { createClient } from '@supabase/supabase-js'
import { generateEmbeddingBatch, EmbeddingRateLimitError } from '@/lib/embeddings/voyage'
import { stripHtml } from '@/lib/parsing/strip-html'
import type { ServiceClient } from '@/lib/supabase/types'
import { computePopularity } from './popularity'

const BATCH_SIZE = 8 // Conservative batch size to stay within Voyage limits
const MAX_ITEMS_PER_RUN = 50

type EmbedResult = {
  itemsEmbedded: number
  popularityComputed: number
  rateLimited: boolean
  error: string | null
  durationMs: number
}

async function embedBatch(
  supabase: ServiceClient,
  items: Array<{ id: string; content_text: string }>
): Promise<number> {
  const texts = items.map((i) => {
    const stripped = stripHtml(i.content_text)
    return stripped.length > 10 ? stripped : `Item content unavailable`
  })
  const embeddings = await generateEmbeddingBatch(texts)

  const rows = items.map((item, idx) => ({
    item_id: item.id,
    embedding: JSON.stringify(embeddings[idx]),
  }))

  const { data } = await supabase
    .from('item_embeddings')
    .upsert(rows, { onConflict: 'item_id', ignoreDuplicates: true })
    .select('item_id')

  return data?.length ?? 0
}

export async function embedNewItems(): Promise<EmbedResult> {
  const start = Date.now()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase non configure')
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Candidats : items recents avec content_text, non deja embeddes.
  const { data: rawItems } = await supabase
    .from('items')
    .select('id, content_text')
    .not('content_text', 'is', null)
    .filter('content_text', 'neq', '')
    .order('fetched_at', { ascending: false })
    .limit(MAX_ITEMS_PER_RUN)

  if (!rawItems || rawItems.length === 0) {
    return {
      itemsEmbedded: 0,
      popularityComputed: 0,
      rateLimited: false,
      error: null,
      durationMs: Date.now() - start,
    }
  }

  const ids = rawItems.map((i) => i.id)
  const { data: existing } = await supabase
    .from('item_embeddings')
    .select('item_id')
    .in('item_id', ids)

  const existingSet = new Set((existing ?? []).map((e) => e.item_id))
  const itemsToEmbed = rawItems.filter((i) => !existingSet.has(i.id))

  if (itemsToEmbed.length === 0) {
    return {
      itemsEmbedded: 0,
      popularityComputed: 0,
      rateLimited: false,
      error: null,
      durationMs: Date.now() - start,
    }
  }

  let totalEmbedded = 0
  let rateLimited = false
  let embedError: string | null = null

  // Process in batches
  for (let i = 0; i < itemsToEmbed.length; i += BATCH_SIZE) {
    const batch = itemsToEmbed.slice(i, i + BATCH_SIZE)
    try {
      totalEmbedded += await embedBatch(supabase, batch)
    } catch (err) {
      if (err instanceof EmbeddingRateLimitError) {
        rateLimited = true
        break // Stop, next run will pick up remaining
      }
      embedError = err instanceof Error ? err.message : String(err)
      break
    }
  }

  // Compute popularity for newly embedded items
  let popularityComputed = 0
  if (totalEmbedded > 0) {
    try {
      popularityComputed = await computePopularity(supabase)
    } catch (err) {
      embedError =
        (embedError ? embedError + '; ' : '') +
        `popularity: ${err instanceof Error ? err.message : String(err)}`
    }
  }

  return {
    itemsEmbedded: totalEmbedded,
    popularityComputed,
    rateLimited,
    error: embedError,
    durationMs: Date.now() - start,
  }
}
