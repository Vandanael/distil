// Persist articles table depuis daily_ranking du jour.
// Contourne le HMR stale du dev server pour appliquer le fix persistRanking.
// Usage : node --env-file=.env.local scripts/persist-articles-from-ranking.mjs
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) process.exit(1)

const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
const today = new Date().toISOString().slice(0, 10)

const DEMO_IDS = new Set([
  '795c2637-7e43-4b74-82b1-560899cf62d7',
  '17e9ac27-5bc3-403c-94e4-cb2d6db1e38c',
  'a615fba9-490a-4dd9-a161-45f8c9b54943',
  'e970bbf3-eb89-476a-bf68-250f53f6ec13',
  'ce745cc5-266e-4293-a677-2cad575f1aef',
])

const { data: rankings } = await sb
  .from('daily_ranking')
  .select('user_id, item_id, bucket, rank, justification, q1_relevance')
  .eq('date', today)

const demoRankings = (rankings ?? []).filter((r) => DEMO_IDS.has(r.user_id))
console.log(`${demoRankings.length} rankings demo a promouvoir en articles`)

const itemIds = [...new Set(demoRankings.map((r) => r.item_id))]
const { data: items } = await sb
  .from('items')
  .select('id, url, title, author, published_at, feed_id, content_text, word_count')
  .in('id', itemIds)
const itemById = new Map((items ?? []).map((i) => [i.id, i]))

const feedIds = [...new Set((items ?? []).map((i) => i.feed_id))]
const { data: feeds } = await sb.from('feeds').select('id, site_name').in('id', feedIds)
const siteById = new Map((feeds ?? []).map((f) => [f.id, f.site_name]))

let done = 0
let errors = 0
for (const r of demoRankings) {
  const item = itemById.get(r.item_id)
  if (!item) continue

  await sb.from('articles').delete().eq('user_id', r.user_id).eq('item_id', r.item_id)

  const { error } = await sb.from('articles').insert({
    user_id: r.user_id,
    item_id: r.item_id,
    url: item.url,
    title: item.title,
    author: item.author,
    site_name: siteById.get(item.feed_id) ?? null,
    published_at: item.published_at,
    content_text: (item.content_text ?? '').slice(0, 500),
    word_count: item.word_count,
    score: r.q1_relevance * 10,
    justification: r.justification,
    is_serendipity: r.bucket === 'surprise',
    status: 'accepted',
    origin: 'agent',
    scored_at: new Date().toISOString(),
  })
  if (error) {
    errors++
    console.warn(`[err] ${r.user_id.slice(0, 8)} ${r.item_id.slice(0, 8)}: ${error.message}`)
  } else done++
}

console.log(`${done} articles inseres, ${errors} erreurs`)
