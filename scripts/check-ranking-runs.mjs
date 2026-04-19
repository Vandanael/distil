import { createClient } from '@supabase/supabase-js'

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const { data, error } = await sb
  .from('ranking_runs')
  .select(
    'created_at, user_id, candidates_count, essential_count, surprise_count, keyword_hits_count, keyword_hits_promoted, keyword_hits_force_injected, fallback, duration_ms, error'
  )
  .order('created_at', { ascending: false })
  .limit(7)

if (error) {
  console.error(error)
  process.exit(1)
}

console.log('user     cand  ess  sur  kwHits  kwProm  kwForce  fb   dur    err')
for (const r of data) {
  const u = r.user_id.slice(0, 8)
  const err = (r.error ?? '').slice(0, 40)
  console.log(
    `${u}  ${String(r.candidates_count).padStart(4)}  ${String(r.essential_count).padStart(3)}  ${String(r.surprise_count).padStart(3)}  ${String(r.keyword_hits_count).padStart(6)}  ${String(r.keyword_hits_promoted).padStart(6)}  ${String(r.keyword_hits_force_injected).padStart(7)}  ${r.fallback ? 'Y' : 'N'}   ${String(r.duration_ms).padStart(5)}  ${err}`
  )
}

const withKw = data.filter((r) => r.keyword_hits_count > 0)
const totalHits = data.reduce((s, r) => s + r.keyword_hits_count, 0)
const totalProm = data.reduce((s, r) => s + r.keyword_hits_promoted, 0)
const totalForce = data.reduce((s, r) => s + (r.keyword_hits_force_injected ?? 0), 0)
console.log(
  `\n${withKw.length}/${data.length} runs avec keyword_hits, total hits ${totalHits}, promoted ${totalProm} (${totalHits ? Math.round((100 * totalProm) / totalHits) : 0}%), force_injected ${totalForce}`
)
