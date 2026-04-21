/**
 * Supprime toutes les donnees utilisateur par user_id.
 * Garde profiles intact sauf si --reset-onboarding est passe.
 *
 * Usage :
 *   npx tsx --env-file=.env.local scripts/wipe-user-data.ts <user_id> [--reset-onboarding]
 *
 * Ordre de suppression choisi pour respecter les FK :
 *   article_tags -> highlights -> notes -> user_feedback -> daily_ranking -> articles
 *   tags (apres article_tags pour eviter les orphelins)
 */
import { createClient } from '@supabase/supabase-js'

const userId = process.argv[2]
const resetOnboarding = process.argv.includes('--reset-onboarding')

if (!userId) {
  console.error('Usage : npx tsx scripts/wipe-user-data.ts <user_id> [--reset-onboarding]')
  process.exit(1)
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('Variables manquantes : NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const sb = createClient(supabaseUrl, serviceKey)

async function deleteTable(table: string, label?: string): Promise<number> {
  const { count, error } = await sb
    .from(table)
    .delete({ count: 'exact' })
    .eq('user_id', userId)
  if (error) {
    console.error(`  ${label ?? table} : erreur - ${error.message}`)
    process.exit(1)
  }
  return count ?? 0
}

console.log(`Wipe user data pour ${userId}`)
console.log('---')

// article_tags et highlights avant articles (FK sur article_id)
const articleTagsCount = await deleteTable('article_tags')
console.log(`  article_tags       : ${articleTagsCount} lignes supprimees`)

const highlightsCount = await deleteTable('highlights')
console.log(`  highlights         : ${highlightsCount} lignes supprimees`)

const notesCount = await deleteTable('notes')
console.log(`  notes              : ${notesCount} lignes supprimees`)

// user_feedback avant articles (FK article_id -> SET NULL, mais on nettoie quand meme)
const feedbackCount = await deleteTable('user_feedback')
console.log(`  user_feedback      : ${feedbackCount} lignes supprimees`)

// daily_ranking
const rankingCount = await deleteTable('daily_ranking')
console.log(`  daily_ranking      : ${rankingCount} lignes supprimees`)

// articles (inclut positive_signal, carry_over_count, below_normal_threshold)
const articlesCount = await deleteTable('articles')
console.log(`  articles           : ${articlesCount} lignes supprimees (positive_signal inclus)`)

// tags apres article_tags
const tagsCount = await deleteTable('tags')
console.log(`  tags               : ${tagsCount} lignes supprimees`)

// user_profile_text
const profileTextCount = await deleteTable('user_profile_text')
console.log(`  user_profile_text  : ${profileTextCount} lignes supprimees`)

// Optionnel : reset onboarding dans profiles
if (resetOnboarding) {
  const { error } = await sb
    .from('profiles')
    .update({ onboarding_completed: false })
    .eq('id', userId)
  if (error) {
    console.error(`  profiles onboarding reset : erreur - ${error.message}`)
    process.exit(1)
  }
  console.log(`  profiles           : onboarding_completed remis a false`)
} else {
  console.log(`  profiles           : conserve (passer --reset-onboarding pour reinitialiser)`)
}

console.log('---')
console.log('Wipe termine.')
