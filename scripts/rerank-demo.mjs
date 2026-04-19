// Regenere les articles des 5 comptes demo :
// 1. Clear daily_ranking du jour + articles existantes
// 2. Trigger cron rank (reconsidere le backlog avec les nouveaux embeddings profil)
// Usage : node --env-file=.env.local scripts/rerank-demo.mjs
import { createClient } from '@supabase/supabase-js'

const DEMO_IDS = [
  '795c2637-7e43-4b74-82b1-560899cf62d7', // pm - Politique & Monde
  '17e9ac27-5bc3-403c-94e4-cb2d6db1e38c', // consultant - Cuisine
  'a615fba9-490a-4dd9-a161-45f8c9b54943', // dev - Tech
  'e970bbf3-eb89-476a-bf68-250f53f6ec13', // chercheur - Sport
  'ce745cc5-266e-4293-a677-2cad575f1aef', // ml - Culture
]

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const appUrl = process.env.NEXT_PUBLIC_APP_URL
const cronSecret = process.env.CRON_SECRET
if (!url || !key || !appUrl || !cronSecret) {
  console.error('Manque env')
  process.exit(1)
}

const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
const today = new Date().toISOString().slice(0, 10)

console.log(`Clear daily_ranking ${today} pour ${DEMO_IDS.length} demo users`)
const { error: delRankErr } = await sb
  .from('daily_ranking')
  .delete()
  .in('user_id', DEMO_IDS)
  .eq('date', today)
if (delRankErr) console.warn('delete daily_ranking:', delRankErr.message)

console.log(`Clear articles pour ${DEMO_IDS.length} demo users`)
const { error: delArtErr } = await sb.from('articles').delete().in('user_id', DEMO_IDS)
if (delArtErr) console.warn('delete articles:', delArtErr.message)

console.log(`\nTrigger POST ${appUrl}/api/cron/rank ...`)
const r = await fetch(`${appUrl}/api/cron/rank`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${cronSecret}` },
})
console.log('status:', r.status)
const body = await r.text()
try {
  const json = JSON.parse(body)
  console.log(`usersProcessed: ${json.usersProcessed}`)
  for (const r of json.results ?? []) {
    if (DEMO_IDS.includes(r.userId)) {
      console.log(
        `  [demo] ${r.userId.slice(0, 8)} essential=${r.essential} surprise=${r.surprise} fallback=${r.fallback} error=${r.error ?? ''} (${r.durationMs}ms)`
      )
    }
  }
} catch {
  console.log(body.slice(0, 500))
}
