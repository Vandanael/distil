/**
 * Populate feeds for test accounts.
 * Discovery + parsing via real pipeline, scoring via keyword heuristic (no LLM needed).
 *
 * Usage: npx tsx scripts/populate-feeds.ts
 */
import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
import { runDiscoveryAgent } from '../src/lib/agents/discovery-agent'
import { parseUrl } from '../src/lib/parsing/readability'
import type { ArticleCandidate, UserProfile } from '../src/lib/agents/types'

const env = readFileSync('.env.local', 'utf8')
function getEnv(key: string): string {
  const match = env.match(new RegExp(`^${key}=(.+)$`, 'm'))
  if (!match) throw new Error(`Missing ${key} in .env.local`)
  return match[1].trim()
}

process.env.NEXT_PUBLIC_SUPABASE_URL = getEnv('NEXT_PUBLIC_SUPABASE_URL')
process.env.SUPABASE_SERVICE_ROLE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY')

const SUPABASE_URL = getEnv('NEXT_PUBLIC_SUPABASE_URL')
const SERVICE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY')

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const TEST_EMAILS = [
  'test-pm@distil.app',
  'test-consultant@distil.app',
  'test-dev@distil.app',
  'test-chercheur@distil.app',
  'test-ml@distil.app',
]

/** Heuristic scoring: keyword match between profile and article content */
function scoreArticle(
  candidate: ArticleCandidate,
  profile: UserProfile
): { score: number; justification: string; accepted: boolean; isSerendipity: boolean } {
  const text = [candidate.title, candidate.excerpt, candidate.contentText.slice(0, 2000)]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  // Split multi-word interests into individual words too
  const rawKeywords = [
    ...(profile.interests ?? []),
    ...(profile.profileText?.split(/[\s,;.]+/) ?? []),
    profile.sector,
  ].filter(Boolean)

  const allKeywords = [
    ...rawKeywords.map((k) => (k as string).toLowerCase()),
    ...rawKeywords.flatMap((k) => (k as string).toLowerCase().split(/\s+/)),
  ]
    .filter((k) => k.length > 3)
    .filter((v, i, a) => a.indexOf(v) === i) // dedupe

  // Count keyword matches
  let matches = 0
  const matchedKeywords: string[] = []
  for (const kw of allKeywords) {
    if (text.includes(kw)) {
      matches++
      if (!matchedKeywords.includes(kw)) matchedKeywords.push(kw)
    }
  }

  // Source bonus
  const domain = extractDomain(candidate.url)
  const isPinned = (profile.pinnedSources ?? []).some((s) =>
    domain.includes(s.replace(/^www\./, ''))
  )

  // Compute score
  const keywordRatio = allKeywords.length > 0 ? matches / allKeywords.length : 0
  let score = Math.round(30 + keywordRatio * 50 + (isPinned ? 15 : 0))
  score = Math.min(95, Math.max(20, score))

  // Add some variance for realism
  score += Math.floor(Math.random() * 10) - 5
  score = Math.min(95, Math.max(15, score))

  const accepted = score >= 35
  const isSerendipity = matchedKeywords.length <= 1 && score >= 35

  const justification = matchedKeywords.length > 0
    ? `Correspond aux sujets : ${matchedKeywords.slice(0, 4).join(', ')}${isPinned ? ' (source favorite)' : ''}`
    : isPinned
      ? 'Source favorite'
      : 'Article hors profil'

  return { score, justification, accepted, isSerendipity }
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

async function populateForUser(email: string) {
  console.log(`\n--- ${email} ---`)

  const { data: users } = await supabase.auth.admin.listUsers()
  const user = users?.users?.find((u) => u.email === email)
  if (!user) {
    console.log('  User not found')
    return
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('profile_text, profile_structured, sector, interests, pinned_sources, daily_cap, serendipity_quota')
    .eq('id', user.id)
    .single()

  if (!profile) {
    console.log('  No profile')
    return
  }

  console.log(`  Profile: ${profile.sector} - ${(profile.interests || []).join(', ')}`)

  // Check existing accepted articles
  const { count } = await supabase
    .from('articles')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'accepted')

  if (count && count > 0) {
    console.log(`  Already has ${count} accepted articles, skipping`)
    return
  }

  const userProfile: UserProfile = {
    profileText: profile.profile_text ?? null,
    profileStructured: profile.profile_structured ?? null,
    sector: profile.sector ?? null,
    interests: profile.interests ?? [],
    pinnedSources: profile.pinned_sources ?? [],
    dailyCap: profile.daily_cap ?? 10,
    serendipityQuota: profile.serendipity_quota ?? 0.15,
  }

  // Create scoring run
  const { data: run } = await supabase
    .from('scoring_runs')
    .insert({ user_id: user.id, agent_type: 'messages' })
    .select('id')
    .single()

  if (!run) {
    console.log('  Failed to create scoring run')
    return
  }

  // 1. Discovery
  console.log('  Running discovery...')
  const discovery = await runDiscoveryAgent(userProfile, [])
  console.log(`  Found ${discovery.urls.length} URLs`)

  if (discovery.urls.length === 0) {
    console.log(`  No URLs found: ${discovery.error ?? 'unknown'}`)
    return
  }

  // 2. Parse
  console.log('  Parsing articles...')
  const parsedResults = await Promise.allSettled(discovery.urls.map((url) => parseUrl(url)))
  const parsed = parsedResults
    .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof parseUrl>>> => r.status === 'fulfilled')
    .map((r) => r.value)
    .filter((p) => p.contentText.length > 200)

  console.log(`  Parsed ${parsed.length} articles`)
  if (parsed.length === 0) return

  // 3. Heuristic scoring
  console.log('  Scoring (heuristic)...')
  const candidates: ArticleCandidate[] = parsed.map((p) => ({
    url: p.url,
    title: p.title,
    excerpt: p.excerpt,
    contentText: p.contentText,
    siteName: p.siteName,
    author: p.author ?? null,
    publishedAt: p.publishedAt ?? null,
    wordCount: p.wordCount,
  }))

  const scored = candidates.map((c) => {
    const result = scoreArticle(c, userProfile)
    return { ...result, url: c.url }
  })

  const accepted = scored.filter((s) => s.accepted)
  const rejected = scored.filter((s) => !s.accepted)

  // 4. Insert
  const parsedByUrl = new Map(parsed.map((p) => [p.url, p]))

  await supabase.from('articles').insert(
    scored.map((s) => {
      const p = parsedByUrl.get(s.url)
      return {
        user_id: user.id,
        url: s.url,
        title: p?.title ?? null,
        author: p?.author ?? null,
        site_name: p?.siteName ?? null,
        published_at: p?.publishedAt ?? null,
        content_html: p?.contentHtml ?? null,
        content_text: p?.contentText ?? null,
        excerpt: p?.excerpt ?? null,
        word_count: p?.wordCount ?? null,
        reading_time_minutes: p?.readingTimeMinutes ?? null,
        score: s.score,
        justification: s.justification,
        is_serendipity: s.isSerendipity,
        rejection_reason: s.accepted ? null : 'low_score',
        status: s.accepted ? 'accepted' : 'rejected',
        origin: 'agent',
        scored_at: new Date().toISOString(),
      }
    })
  )

  // Update run
  await supabase
    .from('scoring_runs')
    .update({
      completed_at: new Date().toISOString(),
      articles_analyzed: scored.length,
      articles_accepted: accepted.length,
      articles_rejected: rejected.length,
    })
    .eq('id', run.id)

  console.log(`  Done: ${accepted.length} accepted, ${rejected.length} rejected`)
}

async function main() {
  console.log('Populating feeds for test accounts...')

  for (const email of TEST_EMAILS) {
    try {
      await populateForUser(email)
    } catch (err) {
      console.error(`  Error for ${email}: ${(err as Error).message}`)
    }
  }

  console.log('\nAll done!')
}

main().catch(console.error)
