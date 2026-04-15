import Parser from 'rss-parser'
import { createHash } from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { stripHtml } from '@/lib/parsing/strip-html'
import type { ServiceClient } from '@/lib/supabase/types'
import type { Feed, IngestResult, IngestSummary } from './types'

const parser = new Parser({
  timeout: 10_000,
  headers: { 'User-Agent': 'Distil/2.0 RSS reader' },
})

function contentHash(url: string, title: string | null, contentSnippet: string | null): string {
  const raw = `${url}|${title ?? ''}|${(contentSnippet ?? '').slice(0, 500)}`
  return createHash('sha256').update(raw).digest('hex')
}

function estimateWordCount(text: string | undefined): number {
  if (!text) return 0
  return text.split(/\s+/).filter(Boolean).length
}

async function fetchFeed(supabase: ServiceClient, feed: Feed): Promise<IngestResult> {
  const result: IngestResult = {
    feedId: feed.id,
    feedUrl: feed.url,
    itemsInserted: 0,
    skipped: false,
    error: null,
  }

  try {
    // Conditional fetch with ETag / Last-Modified
    const headers: Record<string, string> = {
      'User-Agent': 'Distil/2.0 RSS reader',
    }
    if (feed.etag) headers['If-None-Match'] = feed.etag
    if (feed.last_modified) headers['If-Modified-Since'] = feed.last_modified

    const response = await fetch(feed.url, {
      headers,
      signal: AbortSignal.timeout(10_000),
    })

    if (response.status === 304) {
      result.skipped = true
      await supabase
        .from('feeds')
        .update({ last_fetched_at: new Date().toISOString() })
        .eq('id', feed.id)
      return result
    }

    if (!response.ok) {
      result.error = `HTTP ${response.status}`
      return result
    }

    const xml = await response.text()
    const parsed = await parser.parseString(xml)

    // Update feed metadata
    const newEtag = response.headers.get('etag')
    const newLastModified = response.headers.get('last-modified')

    await supabase
      .from('feeds')
      .update({
        last_fetched_at: new Date().toISOString(),
        title: parsed.title ?? feed.title,
        ...(newEtag ? { etag: newEtag } : {}),
        ...(newLastModified ? { last_modified: newLastModified } : {}),
      })
      .eq('id', feed.id)

    if (!parsed.items || parsed.items.length === 0) return result

    // Prepare items for insert
    const rows = parsed.items
      .map((item) => {
        const itemUrl = item.link ?? item.guid ?? ''
        const hash = contentHash(itemUrl, item.title ?? null, item.contentSnippet ?? null)
        const rawItem = item as Record<string, unknown>
        const rawContent = String(
          rawItem['content:encoded'] ?? item.content ?? item.contentSnippet ?? ''
        )
        const contentText = stripHtml(rawContent)

        return {
          feed_id: feed.id,
          guid: item.guid ?? null,
          url: itemUrl,
          title: item.title ?? null,
          author: (rawItem['dc:creator'] as string | undefined) ?? item.creator ?? null,
          published_at: item.isoDate ?? null,
          content_text: contentText.slice(0, 50_000), // Cap at 50k chars
          content_hash: hash,
          word_count: estimateWordCount(contentText),
        }
      })
      .filter((row) => row.url.length > 0)

    if (rows.length === 0) return result

    // Upsert with dedup on content_hash
    const { data } = await supabase
      .from('items')
      .upsert(rows, { onConflict: 'content_hash', ignoreDuplicates: true })
      .select('id')

    result.itemsInserted = data?.length ?? 0
  } catch (err) {
    result.error = err instanceof Error ? err.message : String(err)
  }

  return result
}

export async function ingestAllFeeds(): Promise<IngestSummary> {
  const start = Date.now()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase non configure')
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Load active feeds
  const { data: feeds, error } = await supabase
    .from('feeds')
    .select('id, url, title, site_name, active, last_fetched_at, etag, last_modified')
    .eq('active', true)

  if (error || !feeds) {
    throw new Error(`Impossible de charger les feeds: ${error?.message}`)
  }

  // Process feeds in parallel (bounded concurrency)
  const CONCURRENCY = 5
  const results: IngestResult[] = []

  for (let i = 0; i < feeds.length; i += CONCURRENCY) {
    const batch = feeds.slice(i, i + CONCURRENCY) as Feed[]
    const batchResults = await Promise.allSettled(batch.map((feed) => fetchFeed(supabase, feed)))
    for (let j = 0; j < batchResults.length; j++) {
      const r = batchResults[j]
      if (r.status === 'fulfilled') {
        results.push(r.value)
      } else {
        results.push({
          feedId: batch[j]?.id ?? 'unknown',
          feedUrl: batch[j]?.url ?? 'unknown',
          itemsInserted: 0,
          skipped: false,
          error: r.reason instanceof Error ? r.reason.message : String(r.reason),
        })
      }
    }
  }

  return {
    feedsProcessed: feeds.length,
    totalItemsInserted: results.reduce((sum, r) => sum + r.itemsInserted, 0),
    results,
    durationMs: Date.now() - start,
  }
}
