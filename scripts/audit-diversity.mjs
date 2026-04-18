// Audit read-only : diversite du flux, embeddings items, comptes demo.
// Usage : node --env-file=.env.local scripts/audit-diversity.mjs
import { createClient } from '@supabase/supabase-js'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!URL || !KEY) {
  console.error('Manque NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
const sb = createClient(URL, KEY)

const DEMO = [
  { slug: 'pm', id: '795c2637-7e43-4b74-82b1-560899cf62d7', theme: 'Politique' },
  { slug: 'consultant', id: '17e9ac27-5bc3-403c-94e4-cb2d6db1e38c', theme: 'Cuisine' },
  { slug: 'dev', id: 'a615fba9-490a-4dd9-a161-45f8c9b54943', theme: 'Tech' },
]

function bar(n, max = 30) {
  const w = Math.max(0, Math.round((n / max) * 30))
  return '█'.repeat(Math.min(w, 30))
}

console.log('\n═══ 1. Items par feed (7j) : ingestes vs embeddings ═══\n')
{
  const cutoff = new Date(Date.now() - 7 * 86_400_000).toISOString()
  const { data: feeds } = await sb.from('feeds').select('id, site_name, active').eq('active', true)
  const rows = []
  for (const f of feeds ?? []) {
    const [{ count: total }, { data: itemIds }] = await Promise.all([
      sb.from('items').select('id', { count: 'exact', head: true }).eq('feed_id', f.id).gte('fetched_at', cutoff),
      sb.from('items').select('id').eq('feed_id', f.id).gte('fetched_at', cutoff),
    ])
    let withEmb = 0
    if (itemIds && itemIds.length > 0) {
      const ids = itemIds.map((r) => r.id)
      const { count } = await sb.from('item_embeddings').select('item_id', { count: 'exact', head: true }).in('item_id', ids)
      withEmb = count ?? 0
    }
    rows.push({ site: f.site_name ?? '(null)', total: total ?? 0, withEmb, pct: (total ?? 0) ? Math.round((withEmb / (total ?? 0)) * 100) : 0 })
  }
  rows.sort((a, b) => b.total - a.total)
  console.log('site_name                                  total  emb  %   ')
  for (const r of rows) {
    console.log(`${r.site.padEnd(42)} ${String(r.total).padStart(5)} ${String(r.withEmb).padStart(4)} ${String(r.pct).padStart(3)}%`)
  }
  const totalAll = rows.reduce((a, b) => a + b.total, 0)
  const embAll = rows.reduce((a, b) => a + b.withEmb, 0)
  console.log(`\nTotal 7j : ${totalAll} items, ${embAll} avec embedding (${totalAll ? Math.round((embAll / totalAll) * 100) : 0}%)`)
}

console.log('\n═══ 2. Articles par compte demo (status accepted) ═══\n')
for (const d of DEMO) {
  const [{ count: acc }, { count: rej }, { data: latest }] = await Promise.all([
    sb.from('articles').select('id', { count: 'exact', head: true }).eq('user_id', d.id).eq('status', 'accepted'),
    sb.from('articles').select('id', { count: 'exact', head: true }).eq('user_id', d.id).eq('status', 'rejected'),
    sb.from('articles').select('title, site_name, score, is_serendipity, scored_at').eq('user_id', d.id).eq('status', 'accepted').order('scored_at', { ascending: false }).limit(10),
  ])
  console.log(`[${d.slug}] ${d.theme.padEnd(10)} accepted=${acc ?? 0}  rejected=${rej ?? 0}`)
  if (!latest || latest.length === 0) {
    console.log('  (aucun article accepted)')
  } else {
    for (const a of latest) {
      const dt = a.scored_at?.slice(0, 10) ?? '?'
      const tag = a.is_serendipity ? '★' : ' '
      const title = (a.title ?? '(sans titre)').slice(0, 60)
      console.log(`  ${dt} ${tag} ${String(a.score ?? '').padStart(3)}  ${(a.site_name ?? '?').padEnd(22)} ${title}`)
    }
  }
}

console.log('\n═══ 3. Distribution site_name des articles montres sur la home ═══\n')
{
  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 0).getTime()
  const dayOfYear = Math.floor((now.getTime() - startOfYear) / 86_400_000)
  console.log(`(jour ${dayOfYear} de l'annee, offsets = [${DEMO.map((_, i) => (dayOfYear + i * 7) % 10).join(', ')}])`)
  for (let i = 0; i < DEMO.length; i++) {
    const d = DEMO[i]
    const offset = (dayOfYear + i * 7) % 10
    const { data, error } = await sb
      .from('articles')
      .select('title, site_name, score, is_serendipity')
      .eq('user_id', d.id)
      .eq('status', 'accepted')
      .not('score', 'is', null)
      .order('score', { ascending: false })
      .range(offset, offset)
      .single()
    if (error || !data) {
      console.log(`  [${d.slug}] offset=${offset}  → FALLBACK (${error?.message ?? 'null'})`)
    } else {
      console.log(`  [${d.slug}] offset=${offset}  ${data.site_name ?? '?'}  score=${data.score}  "${(data.title ?? '').slice(0, 60)}"`)
    }
  }
}

console.log('\n═══ 4. Distribution site_name du feed authentifie (tous users, 30 derniers articles par user) ═══\n')
{
  const { data: users } = await sb.from('profiles').select('id').eq('onboarding_completed', true)
  const siteAgg = new Map()
  for (const u of users ?? []) {
    const { data } = await sb
      .from('articles')
      .select('site_name')
      .eq('user_id', u.id)
      .in('status', ['accepted', 'read'])
      .order('scored_at', { ascending: false })
      .limit(30)
    for (const a of data ?? []) {
      const key = a.site_name ?? '(null)'
      siteAgg.set(key, (siteAgg.get(key) ?? 0) + 1)
    }
  }
  const rows = [...siteAgg.entries()].sort((a, b) => b[1] - a[1])
  const max = rows[0]?.[1] ?? 1
  console.log(`(sur ${users?.length ?? 0} users onboarded)`)
  for (const [site, n] of rows) {
    console.log(`  ${String(n).padStart(4)}  ${bar(n, max).padEnd(32)} ${site}`)
  }
}
