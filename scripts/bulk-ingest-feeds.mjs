// Ingest standalone de tous les feeds (contourne dev server).
// Refait la logique de src/lib/ingestion/rss-fetcher.ts avec stripHtml corrige.
// Usage : node --env-file=.env.local scripts/bulk-ingest-feeds.mjs
import { createClient } from '@supabase/supabase-js'
import { parseHTML } from 'linkedom'
import Parser from 'rss-parser'
import { createHash } from 'crypto'

function stripHtml(html) {
  if (!html) return ''
  const { document } = parseHTML(`<!doctype html><html><body>${html}</body></html>`)
  return (document.body?.textContent ?? '').replace(/\s+/g, ' ').trim()
}

function contentHash(url, title, contentSnippet) {
  const raw = `${url}|${title ?? ''}|${(contentSnippet ?? '').slice(0, 500)}`
  return createHash('sha256').update(raw).digest('hex')
}

function wordCount(text) {
  return text ? text.split(/\s+/).filter(Boolean).length : 0
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Manque SUPABASE env')
  process.exit(1)
}

const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
const parser = new Parser({ timeout: 15_000, headers: { 'User-Agent': 'Distil/2.0 RSS reader' } })

const { data: feeds } = await sb.from('feeds').select('id, url, title, etag, last_modified')
console.log(`${feeds.length} feeds a traiter`)

const summary = { total: 0, inserted: 0, errors: 0 }

for (const feed of feeds) {
  try {
    const headers = { 'User-Agent': 'Distil/2.0 RSS reader' }
    if (feed.etag) headers['If-None-Match'] = feed.etag
    if (feed.last_modified) headers['If-Modified-Since'] = feed.last_modified

    const res = await fetch(feed.url, { headers, signal: AbortSignal.timeout(15_000) })
    if (res.status === 304) {
      await sb.from('feeds').update({ last_fetched_at: new Date().toISOString() }).eq('id', feed.id)
      console.log(`[304] ${feed.url}`)
      continue
    }
    if (!res.ok) {
      console.warn(`[${res.status}] ${feed.url}`)
      summary.errors++
      continue
    }

    const xml = await res.text()
    const parsed = await parser.parseString(xml)
    const newEtag = res.headers.get('etag')
    const newLastModified = res.headers.get('last-modified')

    await sb
      .from('feeds')
      .update({
        last_fetched_at: new Date().toISOString(),
        title: parsed.title ?? feed.title,
        ...(newEtag ? { etag: newEtag } : {}),
        ...(newLastModified ? { last_modified: newLastModified } : {}),
      })
      .eq('id', feed.id)

    if (!parsed.items?.length) {
      console.log(`[empty] ${feed.url}`)
      continue
    }

    const rows = parsed.items
      .map((item) => {
        const itemUrl = item.link ?? item.guid ?? ''
        const rawContent = String(
          item['content:encoded'] ?? item.content ?? item.contentSnippet ?? ''
        )
        const contentText = stripHtml(rawContent)
        return {
          feed_id: feed.id,
          guid: item.guid ?? null,
          url: itemUrl,
          title: item.title ?? null,
          author: item['dc:creator'] ?? item.creator ?? null,
          published_at: item.isoDate ?? null,
          content_text: contentText.slice(0, 50_000),
          content_hash: contentHash(itemUrl, item.title ?? null, item.contentSnippet ?? null),
          word_count: wordCount(contentText),
        }
      })
      .filter((row) => row.url.length > 0)

    if (!rows.length) continue

    const { data, error } = await sb
      .from('items')
      .upsert(rows, { onConflict: 'content_hash', ignoreDuplicates: true })
      .select('id')

    if (error) {
      console.warn(`[upsert err] ${feed.url}: ${error.message}`)
      summary.errors++
      continue
    }

    const n = data?.length ?? 0
    summary.total += rows.length
    summary.inserted += n
    console.log(`[+${n}] ${feed.url} (${rows.length} dans le feed)`)
  } catch (err) {
    console.warn(`[err] ${feed.url}: ${err.message}`)
    summary.errors++
  }
}

console.log(
  `\nTermine : ${summary.inserted} nouveaux items inseres (${summary.total} trouves, ${summary.errors} erreurs)`
)
