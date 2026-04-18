// Bulk embed tous les items sans embedding (one-shot, contourne dev server).
// Utilise le stripHtml corrige inline + Voyage voyage-3 par batch de 8.
// Usage : node --env-file=.env.local scripts/bulk-embed-items.mjs
import { createClient } from '@supabase/supabase-js'
import { parseHTML } from 'linkedom'

const VOYAGE_URL = 'https://api.voyageai.com/v1/embeddings'
const MODEL = 'voyage-3'
const BATCH_SIZE = 8
const MAX_CHARS_PER_INPUT = 16000

function stripHtml(html) {
  if (!html) return ''
  const { document } = parseHTML(`<!doctype html><html><body>${html}</body></html>`)
  return (document.body?.textContent ?? '').replace(/\s+/g, ' ').trim()
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const voyageKey = process.env.VOYAGE_API_KEY
if (!url || !key || !voyageKey) {
  console.error('Manque SUPABASE ou VOYAGE_API_KEY')
  process.exit(1)
}

const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

async function fetchBacklog() {
  const { data: raw } = await sb
    .from('items')
    .select('id, content_text')
    .not('content_text', 'is', null)
    .filter('content_text', 'neq', '')
    .limit(1000)
  if (!raw) return []
  const ids = raw.map((i) => i.id)
  // filter existing embeddings par chunks de 500 (Supabase .in limit)
  const existing = new Set()
  for (let i = 0; i < ids.length; i += 500) {
    const chunk = ids.slice(i, i + 500)
    const { data } = await sb.from('item_embeddings').select('item_id').in('item_id', chunk)
    ;(data ?? []).forEach((e) => existing.add(e.item_id))
  }
  return raw.filter((i) => !existing.has(i.id))
}

async function embedBatch(items) {
  const inputs = items
    .map((i) => stripHtml(i.content_text).slice(0, MAX_CHARS_PER_INPUT))
    .map((s) => (s.length > 10 ? s : 'Item content unavailable'))

  const r = await fetch(VOYAGE_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${voyageKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, input: inputs }),
  })
  if (!r.ok) {
    const body = await r.text().catch(() => '')
    throw new Error(`Voyage ${r.status}: ${body.slice(0, 300)}`)
  }
  const json = await r.json()
  const rows = items.map((item, idx) => ({
    item_id: item.id,
    embedding: JSON.stringify(json.data.sort((a, b) => a.index - b.index)[idx].embedding),
  }))
  const { error } = await sb
    .from('item_embeddings')
    .upsert(rows, { onConflict: 'item_id', ignoreDuplicates: true })
  if (error) throw new Error(`Upsert: ${error.message}`)
  return items.length
}

const backlog = await fetchBacklog()
console.log(`Backlog : ${backlog.length} items a embedder`)

let done = 0
let tokens = 0
const started = Date.now()

for (let i = 0; i < backlog.length; i += BATCH_SIZE) {
  const batch = backlog.slice(i, i + BATCH_SIZE)
  try {
    const n = await embedBatch(batch)
    done += n
    const pct = Math.round((done / backlog.length) * 100)
    const eta = Math.round(((Date.now() - started) / done) * (backlog.length - done) / 1000)
    console.log(`[${pct}%] ${done}/${backlog.length}  (ETA ${eta}s)`)
  } catch (err) {
    console.error(`[batch ${i}] ${err.message}`)
    // continue, next batch
  }
}

console.log(`\nTermine : ${done}/${backlog.length} embeddings en ${Math.round((Date.now() - started) / 1000)}s`)
