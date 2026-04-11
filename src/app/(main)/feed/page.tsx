import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArticleCard } from './components/ArticleCard'
import { EmptyFeed } from './components/EmptyFeed'

export default async function FeedPage() {
  let articles: Array<{
    id: string
    title: string | null
    site_name: string | null
    excerpt: string | null
    reading_time_minutes: number | null
    score: number | null
    is_serendipity: boolean
    origin: string
    scored_at: string | null
    word_count: number | null
    og_image_url: string | null
  }> = []

  let rejectedCount = 0
  let showScores = true
  let lastRefreshAt: string | null = null

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const [profileResult, articlesResult, rejectedResult, lastRunResult] = await Promise.all([
        supabase.from('profiles').select('show_scores, daily_cap').eq('id', user.id).single(),
        supabase
          .from('articles')
          .select(
            'id, title, site_name, excerpt, reading_time_minutes, score, is_serendipity, origin, scored_at, word_count, og_image_url'
          )
          .eq('user_id', user.id)
          .in('status', ['accepted', 'read'])
          .order('scored_at', { ascending: false })
          .limit(10), // sera remplace apres avoir lu daily_cap
        supabase
          .from('articles')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'rejected'),
        supabase
          .from('scoring_runs')
          .select('completed_at')
          .eq('user_id', user.id)
          .not('completed_at', 'is', null)
          .gt('articles_accepted', 0)
          .order('completed_at', { ascending: false })
          .limit(1)
          .single(),
      ])

      showScores = profileResult.data?.show_scores ?? true
      const dailyCap = profileResult.data?.daily_cap ?? 10
      lastRefreshAt = lastRunResult.data?.completed_at ?? null

      // Re-fetch avec le bon daily_cap si necessaire
      if (dailyCap !== 10) {
        const { data } = await supabase
          .from('articles')
          .select(
            'id, title, site_name, excerpt, reading_time_minutes, score, is_serendipity, origin, scored_at, word_count, og_image_url'
          )
          .eq('user_id', user.id)
          .in('status', ['accepted', 'read'])
          .order('scored_at', { ascending: false })
          .limit(dailyCap)
        articles = data ?? []
      } else {
        articles = articlesResult.data ?? []
      }

      rejectedCount = rejectedResult.count ?? 0
    }
  }

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:py-12 space-y-10 w-full">
      {/* En-tete */}
      <div className="space-y-4 border-b border-border pb-8">
        <p className="font-ui text-[10px] uppercase tracking-widest text-accent capitalize">
          {today}
        </p>
        <div className="flex items-baseline gap-4">
          <h1 className="font-ui text-4xl font-semibold leading-tight text-foreground">
            Votre veille du jour
          </h1>
          {lastRefreshAt && (
            <span className="font-ui text-[10px] text-muted-foreground/60">
              mis a jour{' '}
              {new Date(lastRefreshAt).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-6">
          <span className="font-ui text-sm text-muted-foreground">
            {articles.length} article{articles.length !== 1 ? 's' : ''}
          </span>
          {rejectedCount > 0 && (
            <Link
              href="/rejected"
              className="font-ui text-sm text-muted-foreground transition-colors hover:text-accent"
              data-testid="link-rejected"
            >
              {rejectedCount} rejet{rejectedCount !== 1 ? 's' : ''} &rarr;
            </Link>
          )}
          <Link
            href="/archive"
            className="font-ui text-sm text-muted-foreground transition-colors hover:text-accent"
            data-testid="link-archive"
          >
            Archives &rarr;
          </Link>
          <Link
            href="/search"
            className="font-ui text-sm text-muted-foreground transition-colors hover:text-accent"
            data-testid="link-search"
          >
            Rechercher &rarr;
          </Link>
        </div>
      </div>

      {/* Articles */}
      <div className="space-y-6" data-testid="feed-articles">
        {articles.length === 0 ? (
          <EmptyFeed />
        ) : (
          articles.map((a) => (
            <ArticleCard
              key={a.id}
              id={a.id}
              title={a.title}
              siteName={a.site_name}
              excerpt={a.excerpt}
              readingTimeMinutes={a.reading_time_minutes}
              score={showScores ? a.score : null}
              isSerendipity={a.is_serendipity}
              origin={a.origin}
              scoredAt={a.scored_at}
              wordCount={a.word_count}
              ogImageUrl={a.og_image_url}
            />
          ))
        )}
      </div>
    </div>
  )
}
