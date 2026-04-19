// Verif read-only migration 00025_weighted_keyword_ranking
// Usage : node --env-file=.env.local scripts/verify-00025.mjs
import { createClient } from '@supabase/supabase-js'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!URL || !KEY) {
  console.error('Manque NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
const sb = createClient(URL, KEY)

let ok = 0
let ko = 0
const line = (label, pass, detail = '') => {
  const tag = pass ? 'OK  ' : 'FAIL'
  console.log(`  [${tag}] ${label}${detail ? ` - ${detail}` : ''}`)
  if (pass) ok += 1
  else ko += 1
}

console.log('\n=== 1. ranking_runs.keyword_hits_force_injected existe ===\n')
{
  const { error } = await sb.from('ranking_runs').select('keyword_hits_force_injected').limit(1)
  if (error) line('SELECT keyword_hits_force_injected', false, error.message)
  else line('colonne accessible', true)
}

console.log('\n=== 2. RPC prefilter v3 retourne keyword_rank ===\n')
{
  const { data: profiles } = await sb
    .from('profiles')
    .select('id, interests, embedding')
    .not('embedding', 'is', null)
    .not('interests', 'is', null)
    .limit(20)
  const target = (profiles ?? []).find((p) => (p.interests ?? []).length > 0)
  if (!target) {
    line('aucun user avec embedding + interests - skip', true)
  } else {
    const emb =
      typeof target.embedding === 'string' ? target.embedding : JSON.stringify(target.embedding)
    const { data, error } = await sb.rpc('prefilter_ranking_candidates', {
      user_embedding: emb,
      target_user_id: target.id,
      cutoff_time: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      max_count: 40,
      keyword_cap: 60,
    })
    if (error) {
      line('RPC prefilter_ranking_candidates v3', false, error.message)
    } else {
      const rows = data ?? []
      const hasKw = rows.filter((r) => r.is_keyword_hit)
      const hasRank = hasKw.filter((r) => typeof r.keyword_rank === 'number' && r.keyword_rank > 0)
      line(`total ${rows.length} rows`, true)
      line(
        `keyword_hits avec keyword_rank > 0 : ${hasRank.length}/${hasKw.length}`,
        hasRank.length === hasKw.length && hasKw.length > 0
      )
      // Verification weighted : un match titre devrait avoir un rank > match corpus.
      // Heuristique : si au moins un item a un rank > 0.05, la ponderation A est active
      // (setweight(A)*to_tsvector sur titre donne typiquement >= 0.06 sur 1-3 matches).
      const highRank = hasKw.filter((r) => r.keyword_rank > 0.05).length
      line(`items avec rank > 0.05 (signal titre fort) : ${highRank}/${hasKw.length}`, highRank > 0)

      if (hasRank.length > 0) {
        console.log('\n  Top 5 keyword_hits par ts_rank (titre match fort) :')
        const top = [...hasRank].sort((a, b) => b.keyword_rank - a.keyword_rank).slice(0, 5)
        for (const r of top) {
          console.log(
            `    ${Number(r.keyword_rank).toFixed(4)}  ${(r.title ?? r.url).slice(0, 60).padEnd(62)} [${(r.matched_keywords ?? []).join(', ')}]`
          )
        }
      }
    }
  }
}

console.log(`\n=== Resultat : ${ok} OK, ${ko} FAIL ===\n`)
process.exit(ko > 0 ? 1 : 0)
