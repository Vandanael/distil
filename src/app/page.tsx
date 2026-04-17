import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { StartScreen } from './StartScreen'

// Fallback editorial : 3 articles perennes pour que la homepage ne soit jamais
// vide meme si les comptes demo ne sont pas seed ou si serviceKey est absent.
// Choisi pour illustrer la diversite thematique (politique / culture / science).
const FALLBACK_ARTICLES: FeaturedArticle[] = [
  {
    title: 'The Atlantic - recent features in international affairs',
    url: 'https://www.theatlantic.com/world/',
    site_name: 'The Atlantic',
    excerpt: null,
    score: null,
    is_serendipity: false,
  },
  {
    title: 'The New Yorker - culture and ideas',
    url: 'https://www.newyorker.com/culture',
    site_name: 'The New Yorker',
    excerpt: null,
    score: null,
    is_serendipity: false,
  },
  {
    title: 'Quanta Magazine - science reporting',
    url: 'https://www.quantamagazine.org/',
    site_name: 'Quanta Magazine',
    excerpt: null,
    score: null,
    is_serendipity: true,
  },
]

type FeaturedArticle = {
  title: string | null
  url: string | null
  site_name: string | null
  excerpt: string | null
  score: number | null
  is_serendipity: boolean
}

export default async function RootPage() {
  // Dev : bypass auth (uniquement en developpement local)
  if (
    (process.env.NODE_ENV === 'development' && process.env.DEV_BYPASS_AUTH === 'true') ||
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

  // Non-connecte : 1 article par persona (diversite des themes)
  let featuredArticles: FeaturedArticle[] = []

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (serviceKey) {
    const serviceClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey)

    // IDs stables des comptes démo (créés par create-test-accounts.mjs)
    const DEMO_USER_IDS = [
      '795c2637-7e43-4b74-82b1-560899cf62d7', // test-pm (Politique & Monde)
      '17e9ac27-5bc3-403c-94e4-cb2d6db1e38c', // test-consultant (Cuisine)
      'a615fba9-490a-4dd9-a161-45f8c9b54943', // test-dev (Tech)
    ]

    if (DEMO_USER_IDS.length > 0) {
      // Rotation quotidienne : offset different par jour et par persona
      const now = new Date()
      const startOfYear = new Date(now.getFullYear(), 0, 0).getTime()
      const dayOfYear = Math.floor((now.getTime() - startOfYear) / 86_400_000)

      const picks = await Promise.all(
        DEMO_USER_IDS.map((uid, i) => {
          const offset = (dayOfYear + i * 7) % 10
          return serviceClient
            .from('articles')
            .select('title, url, site_name, excerpt, score, is_serendipity')
            .eq('user_id', uid)
            .eq('status', 'accepted')
            .not('score', 'is', null)
            .order('score', { ascending: false })
            .range(offset, offset)
            .single()
        })
      )

      featuredArticles = picks.filter((r) => r.data !== null).map((r) => r.data!)
    }
  }

  // Plancher prod : si on a moins de 3 articles reels, on complete avec le
  // fallback editorial. Garantit que la homepage n'est jamais vide.
  if (featuredArticles.length < 3) {
    const needed = 3 - featuredArticles.length
    featuredArticles = [...featuredArticles, ...FALLBACK_ARTICLES.slice(0, needed)]
  }

  return <StartScreen articles={featuredArticles} />
}
