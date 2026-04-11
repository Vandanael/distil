import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { StartScreen } from './StartScreen'

export default async function RootPage() {
  // Dev : bypass auth
  if (
    process.env.DEV_BYPASS_AUTH === 'true' ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    redirect('/feed')
  }

  // Check auth
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single()

    redirect(profile?.onboarding_completed ? '/feed' : '/onboarding')
  }

  // Non-connecte : fetch 3 articles haute qualite via service role
  let featuredArticles: Array<{
    title: string | null
    site_name: string | null
    excerpt: string | null
    score: number | null
    is_serendipity: boolean
  }> = []

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (serviceKey) {
    const serviceClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey)

    // Essai : articles des dernieres 24h avec bon score
    const since = new Date(new Date().getTime() - 24 * 60 * 60 * 1000).toISOString()
    const { data: recent } = await serviceClient
      .from('articles')
      .select('title, site_name, excerpt, score, is_serendipity')
      .eq('status', 'accepted')
      .not('score', 'is', null)
      .gte('scored_at', since)
      .order('score', { ascending: false })
      .limit(3)

    if (recent && recent.length >= 3) {
      featuredArticles = recent
    } else {
      // Fallback : tous les articles acceptes
      const { data: fallback } = await serviceClient
        .from('articles')
        .select('title, site_name, excerpt, score, is_serendipity')
        .eq('status', 'accepted')
        .not('score', 'is', null)
        .order('score', { ascending: false })
        .limit(3)

      featuredArticles = fallback ?? []
    }
  }

  return <StartScreen articles={featuredArticles} />
}
