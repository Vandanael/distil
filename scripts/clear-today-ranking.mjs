// Purge le ranking du jour pour pouvoir relancer /api/cron/rank avec 00025.
// Usage : node --env-file=.env.local scripts/clear-today-ranking.mjs
import { createClient } from '@supabase/supabase-js'

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const today = new Date().toISOString().slice(0, 10)

// 1. daily_ranking (bloque rankForUser si present)
const { count: rankingCount, error: rErr } = await sb
  .from('daily_ranking')
  .delete({ count: 'exact' })
  .eq('date', today)
if (rErr) {
  console.error('daily_ranking delete failed', rErr.message)
  process.exit(1)
}

// 2. articles agent-origin du jour (pour que persistRanking puisse re-inserer proprement)
const startOfDay = `${today}T00:00:00Z`
const { count: articlesCount } = await sb
  .from('articles')
  .delete({ count: 'exact' })
  .eq('origin', 'agent')
  .gte('scored_at', startOfDay)

// 3. ranking_runs du jour (pour comparer apprentissage net)
const { count: runsCount } = await sb
  .from('ranking_runs')
  .delete({ count: 'exact' })
  .eq('date', today)

console.log(`Purged for ${today}:`)
console.log(`  daily_ranking: ${rankingCount} rows`)
console.log(`  articles (agent): ${articlesCount} rows`)
console.log(`  ranking_runs: ${runsCount} rows`)
