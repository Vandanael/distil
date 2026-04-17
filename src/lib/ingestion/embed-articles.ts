import { createClient } from '@supabase/supabase-js'
import { generateEmbeddingBatch, EmbeddingRateLimitError } from '@/lib/embeddings/voyage'
import { stripHtml } from '@/lib/parsing/strip-html'
import type { ServiceClient } from '@/lib/supabase/types'

const BATCH_SIZE = 8
const MAX_ARTICLES_PER_RUN = 50

type EmbedResult = {
  articlesEmbedded: number
  rateLimited: boolean
  error: string | null
  durationMs: number
}

async function embedBatch(
  supabase: ServiceClient,
  articles: Array<{ id: string; content_text: string }>
): Promise<number> {
  const texts = articles.map((a) => {
    const stripped = stripHtml(a.content_text)
    return stripped.length > 10 ? stripped : 'Article content unavailable'
  })
  const embeddings = await generateEmbeddingBatch(texts)

  let updated = 0
  for (let i = 0; i < articles.length; i++) {
    const { error } = await supabase
      .from('articles')
      .update({ embedding: JSON.stringify(embeddings[i]) })
      .eq('id', articles[i].id)
    if (!error) updated++
  }
  return updated
}

/**
 * Rattrape les articles acceptes sans embedding.
 * Sert de filet de securite pour :
 * - bookmarklet articles/save (fire-and-forget maintenu pour latence UX)
 * - toute erreur transitoire Voyage pendant les crons de scoring
 */
export async function embedPendingArticles(): Promise<EmbedResult> {
  const start = Date.now()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase non configure')
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const { data: pending, error } = await supabase
    .from('articles')
    .select('id, content_text')
    .eq('status', 'accepted')
    .is('embedding', null)
    .not('content_text', 'is', null)
    .filter('content_text', 'neq', '')
    .order('created_at', { ascending: false })
    .limit(MAX_ARTICLES_PER_RUN)

  if (error) {
    return {
      articlesEmbedded: 0,
      rateLimited: false,
      error: error.message,
      durationMs: Date.now() - start,
    }
  }

  if (!pending || pending.length === 0) {
    return {
      articlesEmbedded: 0,
      rateLimited: false,
      error: null,
      durationMs: Date.now() - start,
    }
  }

  let totalEmbedded = 0
  let rateLimited = false
  let embedError: string | null = null

  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    const batch = pending.slice(i, i + BATCH_SIZE) as Array<{ id: string; content_text: string }>
    try {
      totalEmbedded += await embedBatch(supabase, batch)
    } catch (err) {
      if (err instanceof EmbeddingRateLimitError) {
        rateLimited = true
        break
      }
      embedError = err instanceof Error ? err.message : String(err)
      break
    }
  }

  return {
    articlesEmbedded: totalEmbedded,
    rateLimited,
    error: embedError,
    durationMs: Date.now() - start,
  }
}
