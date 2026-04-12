import { createClient } from '@/lib/supabase/server'
import { ArticleCard } from './components/ArticleCard'
import { EmptyFeed } from './components/EmptyFeed'
import { FeedShell } from './components/FeedShell'
import { FeedHeader } from './components/FeedHeader'

export default async function FeedPage() {
  let articles: Array<{
    id: string
    title: string | null
    site_name: string | null
    excerpt: string | null
    reading_time_minutes: number | null
    score: number | null
    justification: string | null
    is_serendipity: boolean
    origin: string
    scored_at: string | null
    word_count: number | null
    og_image_url: string | null
    status: string
  }> = []

  let showScores = true
  let lastRefreshAt: string | null = null
  let interests: string[] = []

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const profileResult = await supabase
        .from('profiles')
        .select('show_scores, daily_cap, interests')
        .eq('id', user.id)
        .single()

      showScores = profileResult.data?.show_scores ?? true
      const dailyCap = profileResult.data?.daily_cap ?? 10
      interests = profileResult.data?.interests ?? []

      const [articlesResult, lastRunResult] = await Promise.all([
        supabase
          .from('articles')
          .select(
            'id, title, site_name, excerpt, reading_time_minutes, score, justification, is_serendipity, origin, scored_at, word_count, og_image_url, status'
          )
          .eq('user_id', user.id)
          .in('status', ['accepted', 'read'])
          .order('scored_at', { ascending: false })
          .limit(dailyCap),
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

      articles = articlesResult.data ?? []
      lastRefreshAt = lastRunResult.data?.completed_at ?? null
    }
  }

  // Passe une date ISO pour que FeedHeader formate selon la locale client
  const todayIso = new Date().toISOString()
  const topInterests = interests.slice(0, 3)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-10 w-full">
      <FeedHeader today={todayIso} lastRefreshAt={lastRefreshAt} topInterests={topInterests} />

      {/* Articles */}
      <FeedShell className="space-y-8">
        {articles.length === 0 ? (
          <EmptyFeed />
        ) : (
          articles.map((a, i) => (
            <ArticleCard
              key={a.id}
              id={a.id}
              staggerIndex={i}
              title={a.title}
              siteName={a.site_name}
              excerpt={a.excerpt}
              readingTimeMinutes={a.reading_time_minutes}
              score={showScores ? a.score : null}
              justification={showScores ? a.justification : null}
              isSerendipity={a.is_serendipity}
              origin={a.origin}
              scoredAt={a.scored_at}
              wordCount={a.word_count}
              ogImageUrl={a.og_image_url}
              isRead={a.status === 'read'}
            />
          ))
        )}
      </FeedShell>
    </div>
  )
}
