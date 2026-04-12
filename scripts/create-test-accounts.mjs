/**
 * Create 5 test accounts with persona-appropriate profiles.
 * Usage: node scripts/create-test-accounts.mjs
 *
 * Outputs magic link URLs for each account.
 */
import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const env = readFileSync('.env.local', 'utf8')
function getEnv(key) {
  const match = env.match(new RegExp(`^${key}=(.+)$`, 'm'))
  if (!match) throw new Error(`Missing ${key} in .env.local`)
  return match[1].trim()
}

const SUPABASE_URL = getEnv('NEXT_PUBLIC_SUPABASE_URL')
const SERVICE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY')

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const SITE_URL = 'https://distil.netlify.app'

const PERSONAS = [
  {
    name: 'Yvan (PM/Strategiste)',
    email: 'test-pm@distil.app',
    profile: {
      profile_text:
        'PM senior, product strategy, IA appliquee au produit, startups B2B SaaS, growth loops, decision frameworks',
      sector: 'Produit',
      interests: ['product management', 'IA', 'strategie', 'B2B SaaS', 'growth'],
      pinned_sources: ['stratechery.com', 'lennysnewsletter.com', 'producthunt.com'],
      daily_cap: 10,
      serendipity_quota: 0.15,
    },
  },
  {
    name: 'Marc (Consultant mobile)',
    email: 'test-consultant@distil.app',
    profile: {
      profile_text:
        'Consultant en transformation digitale, usage mobile-first, peu de temps, veut du contenu pertinent sans effort',
      sector: 'Consulting',
      interests: ['transformation digitale', 'management', 'tendances tech', 'leadership'],
      pinned_sources: ['hbr.org', 'mckinsey.com', 'lesechos.fr'],
      daily_cap: 5,
      serendipity_quota: 0.3,
    },
  },
  {
    name: 'Sarah (Dev ex-Feedly)',
    email: 'test-dev@distil.app',
    profile: {
      profile_text:
        'Developpeuse fullstack, ex-utilisatrice Feedly/Inoreader, veut un RSS reader intelligent avec du filtrage IA',
      sector: 'Developpement',
      interests: ['web development', 'TypeScript', 'React', 'open source', 'dev tools'],
      pinned_sources: ['news.ycombinator.com', 'lobste.rs', 'tldr.tech'],
      daily_cap: 20,
      serendipity_quota: 0.15,
    },
  },
  {
    name: 'Claire (Chercheuse/Analyste)',
    email: 'test-chercheur@distil.app',
    profile: {
      profile_text:
        'Chercheuse en sciences sociales, veille academique et geopolitique, analyse semantique profonde, export Obsidian',
      sector: 'Recherche',
      interests: ['geopolitique', 'sciences sociales', 'epistemologie', 'data analysis', 'recherche'],
      pinned_sources: ['arxiv.org', 'nature.com', 'lemonde.fr'],
      daily_cap: 15,
      serendipity_quota: 0.5,
    },
  },
  {
    name: 'Thomas (Sceptique AI/ML)',
    email: 'test-ml@distil.app',
    profile: {
      profile_text:
        'ML engineer, allergique au slop et au hype IA, veut de la densite technique et des sources primaires, pas de blog corporate',
      sector: 'Ingenierie',
      interests: ['machine learning', 'MLOps', 'LLM', 'systems engineering', 'research papers'],
      pinned_sources: ['arxiv.org', 'simonwillison.net', 'lilianweng.github.io'],
      daily_cap: 10,
      serendipity_quota: 0.15,
    },
  },
]

async function main() {
  console.log('Creating 5 test accounts...\n')

  for (const persona of PERSONAS) {
    console.log(`--- ${persona.name} (${persona.email}) ---`)

    // 1. Create user (or get existing)
    let userId
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existing = existingUsers?.users?.find((u) => u.email === persona.email)

    if (existing) {
      userId = existing.id
      console.log(`  User already exists: ${userId}`)
    } else {
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: persona.email,
        email_confirm: true,
      })
      if (createError) {
        console.error(`  Error creating user: ${createError.message}`)
        continue
      }
      userId = newUser.user.id
      console.log(`  User created: ${userId}`)
    }

    // 2. Upsert profile (service role bypasses RLS)
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: userId,
      profile_text: persona.profile.profile_text,
      sector: persona.profile.sector,
      interests: persona.profile.interests,
      pinned_sources: persona.profile.pinned_sources,
      daily_cap: persona.profile.daily_cap,
      serendipity_quota: persona.profile.serendipity_quota,
      show_scores: true,
      onboarding_completed: true,
      onboarding_method: 'express',
    })

    if (profileError) {
      console.error(`  Error creating profile: ${profileError.message}`)
      continue
    }
    console.log(`  Profile created`)

    // 3. Generate magic link
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: persona.email,
      options: { redirectTo: `${SITE_URL}/feed` },
    })

    if (linkError) {
      console.error(`  Error generating link: ${linkError.message}`)
      continue
    }

    // The generated link has the token - construct the full URL
    const { hashed_token } = linkData.properties
    const verifyUrl = `${SUPABASE_URL}/auth/v1/verify?token=${hashed_token}&type=magiclink&redirect_to=${encodeURIComponent(`${SITE_URL}/feed`)}`
    console.log(`  Magic link: ${verifyUrl}`)
    console.log()
  }

  console.log('Done! Click each magic link to log in as that persona.')
}

main().catch(console.error)
