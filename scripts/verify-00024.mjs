// Verif read-only migration 00024_lexical_recall
// Usage : node --env-file=.env.local scripts/verify-00024.mjs
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
  pass ? ok++ : ko++
}

console.log('\n=== 1. ranking_runs : colonnes telemetrie ===\n')
{
  const { data, error } = await sb
    .from('ranking_runs')
    .select('id, keyword_hits_count, keyword_hits_promoted')
    .limit(1)
  if (error) line('SELECT keyword_hits_* sur ranking_runs', false, error.message)
  else line('colonnes keyword_hits_count + keyword_hits_promoted accessibles', true)
}

console.log('\n=== 2. profiles.interests : backfill normalise ===\n')
{
  const { data, error } = await sb
    .from('profiles')
    .select('id, interests')
    .not('interests', 'is', null)
    .limit(10)
  if (error) {
    line('lecture profiles', false, error.message)
  } else {
    const nonEmpty = (data ?? []).filter((p) => (p.interests ?? []).length > 0)
    let bad = []
    for (const p of nonEmpty) {
      for (const k of p.interests) {
        const norm = k
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .trim()
        if (k !== norm) bad.push({ id: p.id, original: k, expected: norm })
      }
      const dedup = new Set(p.interests)
      if (dedup.size !== p.interests.length) bad.push({ id: p.id, dup: p.interests })
    }
    line(`${nonEmpty.length} profiles avec interests verifies`, bad.length === 0)
    if (bad.length > 0) console.log('   Cas non normalises :', bad.slice(0, 5))
  }
}

console.log('\n=== 3. RPC list_keyword_hits ===\n')
{
  // Prend un user avec interests non vides
  const { data: profiles } = await sb
    .from('profiles')
    .select('id, interests')
    .not('interests', 'is', null)
    .limit(20)
  const target = (profiles ?? []).find((p) => (p.interests ?? []).length > 0)
  if (!target) {
    line('aucun user avec interests - skip', true)
  } else {
    const cutoff = new Date(Date.now() - 48 * 3600 * 1000).toISOString()
    const { data, error } = await sb.rpc('list_keyword_hits', {
      target_user_id: target.id,
      cutoff_time: cutoff,
    })
    if (error) {
      line('RPC list_keyword_hits', false, error.message)
    } else {
      const rows = data ?? []
      const perKw = new Map()
      for (const r of rows) perKw.set(r.keyword, (perKw.get(r.keyword) ?? 0) + 1)
      line(
        `RPC OK, ${rows.length} hits pour user ${target.id.slice(0, 8)} (${target.interests.length} keywords)`,
        true
      )
      for (const [k, n] of [...perKw.entries()].sort((a, b) => b[1] - a[1])) {
        console.log(`    ${k.padEnd(25)} ${n} hits`)
      }
    }
  }
}

console.log('\n=== 4. RPC prefilter_ranking_candidates v2 ===\n')
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
    const cutoff = new Date(Date.now() - 48 * 3600 * 1000).toISOString()
    // embedding peut etre string JSON ou array selon le driver
    const emb =
      typeof target.embedding === 'string' ? target.embedding : JSON.stringify(target.embedding)
    const { data, error } = await sb.rpc('prefilter_ranking_candidates', {
      user_embedding: emb,
      target_user_id: target.id,
      cutoff_time: cutoff,
      max_count: 40,
      keyword_cap: 40,
    })
    if (error) {
      line('RPC prefilter_ranking_candidates', false, error.message)
    } else {
      const rows = data ?? []
      const cosine = rows.filter((r) => !r.is_keyword_hit)
      const kw = rows.filter((r) => r.is_keyword_hit)
      line(`RPC OK, total ${rows.length} = cosine ${cosine.length} + keyword ${kw.length}`, true)
      if (kw.length > 0) {
        console.log('    Exemples keyword hits :')
        for (const r of kw.slice(0, 3)) {
          console.log(
            `      ${(r.title ?? r.url).slice(0, 60).padEnd(62)} [${(r.matched_keywords ?? []).join(', ')}] ${r.word_count}w`
          )
        }
      }
      // Verif word_count >= 300 sur le pool cosine uniquement
      const cosineShort = cosine.filter((r) => (r.word_count ?? 0) < 300)
      line(
        `cosine_pool exclut word_count < 300 (${cosineShort.length} violations)`,
        cosineShort.length === 0
      )
    }
  }
}

console.log(`\n=== Resultat : ${ok} OK, ${ko} FAIL ===\n`)
process.exit(ko > 0 ? 1 : 0)
