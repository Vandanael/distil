/**
 * Cleanup script : reparse articles with site_name = domain (post-migration 00037)
 * to recover editorial siteName from og:site_name via Readability.
 *
 * Run: npx tsx scripts/cleanup-site-name.ts
 */
import { createClient } from '@supabase/supabase-js'
import { parseUrl } from '../src/lib/parsing/readability'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function main() {
  // Articles whose site_name looks like a raw domain (set by migration 00037 fallback)
  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, url, site_name, content_html')
    .like('site_name', '%.%')
    .not('content_html', 'is', null)

  if (error) {
    console.error('Fetch error:', error.message)
    process.exit(1)
  }

  console.log(`Found ${articles.length} articles with domain-like site_name to check`)

  let fixed = 0
  let unchanged = 0
  let failed = 0

  for (const article of articles) {
    try {
      const parsed = await parseUrl(article.url)
      if (parsed.siteName && parsed.siteName !== article.site_name) {
        const { error: updateError } = await supabase
          .from('articles')
          .update({ site_name: parsed.siteName })
          .eq('id', article.id)
        if (updateError) {
          console.error(`  Failed to update ${article.id}:`, updateError.message)
          failed++
        } else {
          console.log(`  ${article.site_name} -> ${parsed.siteName} (${article.url})`)
          fixed++
        }
      } else {
        unchanged++
      }
    } catch {
      // Paywall, timeout, etc.
      failed++
    }
  }

  console.log(`\nDone: ${fixed} corrected via parsing, ${unchanged} unchanged, ${failed} failures`)
}

main().catch(console.error)