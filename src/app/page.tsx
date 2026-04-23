import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { DEMO_ACCOUNTS, HOME_FEATURED_SLUGS, type DemoAccountSlug } from '@/lib/demo-accounts'
import { StartScreen } from './StartScreen'

// Revalidation horaire : le compteur "editions livrees" se rafraichit toutes les heures,
// suffisant pour suivre le cron digest quotidien sans battre la base a chaque visite.
export const revalidate = 3600

// Allowlist SEO : / et /about sont les 2 seules pages publiques indexables.
// Tout le reste heritage du layout racine (noindex par defaut, defense en profondeur).
const HOME_DESCRIPTION =
  'Distil lit le web à votre place chaque matin et ne garde que ce qui compte. Curation IA transparente, diversité éditoriale, zéro algorithme de popularité.'

export const metadata = {
  title: 'Distil - votre veille quotidienne, sans le bruit',
  description: HOME_DESCRIPTION,
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Distil - votre veille quotidienne, sans le bruit',
    description: HOME_DESCRIPTION,
    url: '/',
  },
  twitter: {
    title: 'Distil - votre veille quotidienne, sans le bruit',
    description: HOME_DESCRIPTION,
  },
  alternates: { canonical: '/' },
}

// Fallback editorial : articles perennes, n'apparaissent QUE si aucun article
// score n'est disponible (serviceKey absent, comptes demo vides). Ils sont
// affiches sous un heading distinct "Exemples editoriaux" pour ne jamais
// cohabiter avec des articles scores et trahir la demo vide.
// 3 articles, 3 themes distincts : produit francophone par défaut.
const FALLBACK_ARTICLES: FeaturedArticle[] = [
  {
    title: 'Le Monde diplomatique',
    url: 'https://www.monde-diplomatique.fr/',
    site_name: 'Le Monde diplomatique',
    excerpt: null,
    score: null,
    is_serendipity: false,
    justification: null,
    persona_slug: null,
  },
  {
    title: 'France Culture - La Suite dans les idées',
    url: 'https://www.radiofrance.fr/franceculture',
    site_name: 'France Culture',
    excerpt: null,
    score: null,
    is_serendipity: false,
    justification: null,
    persona_slug: null,
  },
  {
    title: "Reporterre - le quotidien de l'écologie",
    url: 'https://reporterre.net/',
    site_name: 'Reporterre',
    excerpt: null,
    score: null,
    is_serendipity: true,
    justification: null,
    persona_slug: null,
  },
]

// 1 article par persona vitrine, total = EDITION_TARGET.
const EDITION_TARGET = 3

type FeaturedArticle = {
  title: string | null
  url: string | null
  site_name: string | null
  excerpt: string | null
  score: number | null
  is_serendipity: boolean
  justification: string | null
  persona_slug: DemoAccountSlug | null
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
  let editionsToday = 0

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (serviceKey) {
    const serviceClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey)

    // Compteur "editions livrees aujourd'hui" : count distinct user_id dans daily_ranking
    // pour la date du jour. Inclut comptes demo (ils recoivent une vraie edition chaque matin).
    const today = new Date().toISOString().slice(0, 10)
    const { data: rankingsToday } = await serviceClient
      .from('daily_ranking')
      .select('user_id')
      .eq('date', today)
    editionsToday = new Set((rankingsToday ?? []).map((r) => r.user_id)).size

    const demoUserIds = HOME_FEATURED_SLUGS.map(
      (slug) => DEMO_ACCOUNTS.find((a) => a.slug === slug)!.id
    )

    if (demoUserIds.length > 0) {
      // Rotation quotidienne : offset different par jour et par persona.
      // Fetch top 5 par persona puis dedup site_name pour eviter 5 Le Monde a la home.
      const now = new Date()
      const startOfYear = new Date(now.getFullYear(), 0, 0).getTime()
      const dayOfYear = Math.floor((now.getTime() - startOfYear) / 86_400_000)

      const picks = await Promise.all(
        demoUserIds.map((uid, i) => {
          const offset = (dayOfYear + i * 7) % 10
          return serviceClient
            .from('articles')
            .select('title, url, site_name, excerpt, score, is_serendipity, justification')
            .eq('user_id', uid)
            .eq('status', 'pending')
            .not('score', 'is', null)
            .order('score', { ascending: false })
            .range(offset, offset + 4)
        })
      )

      const usedSites = new Set<string>()
      const collected: FeaturedArticle[] = []
      picks.forEach((r, i) => {
        const candidates = r.data ?? []
        // Prefere un article dont le site n'a pas encore été choisi pour une autre persona.
        const unique = candidates.find((a) => a.site_name && !usedSites.has(a.site_name))
        const pick = unique ?? candidates[0]
        if (!pick) return
        if (pick.site_name) usedSites.add(pick.site_name)
        collected.push({ ...pick, persona_slug: HOME_FEATURED_SLUGS[i] })
      })
      featuredArticles = collected
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
        .slice(0, EDITION_TARGET)
    }
  }

  // On ne mixe plus fallback + scored : un article sans score a cote d'articles
  // 80% trahit la demo vide (feedback panel 21 personae, sprint 35).
  // Si on n'a aucun article score, on bascule sur le fallback editorial label
  // "Exemples editoriaux" via le flag isFallback.
  const isFallback = featuredArticles.length === 0
  const articles = isFallback ? FALLBACK_ARTICLES.slice(0, EDITION_TARGET) : featuredArticles

  return <StartScreen articles={articles} isFallback={isFallback} editionsToday={editionsToday} />
}
