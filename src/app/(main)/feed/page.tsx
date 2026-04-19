import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArticleCard } from './components/ArticleCard'
import { EmptyFeed } from './components/EmptyFeed'
import { FeedShell } from './components/FeedShell'
import { FeedHeader } from './components/FeedHeader'
import { DismissProvider } from './components/DismissContext'

type FeedArticle = {
  id: string
  item_id: string | null
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
}

type SubScores = { q1: number | null; q2: number | null; q3: number | null }

function sortByScoreDesc(a: FeedArticle, b: FeedArticle): number {
  const sa = a.score ?? -1
  const sb = b.score ?? -1
  if (sb !== sa) return sb - sa
  // Secondary : scored_at desc pour stabilite
  const ta = a.scored_at ? new Date(a.scored_at).getTime() : 0
  const tb = b.scored_at ? new Date(b.scored_at).getTime() : 0
  return tb - ta
}

export default async function FeedPage() {
  let articles: FeedArticle[] = []

  let lastRefreshAt: string | null = null
  let interests: string[] = []
  let rejectedCount = 0
  const subScoresByItemId = new Map<string, SubScores>()

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const profileResult = await supabase
        .from('profiles')
        .select('daily_cap, interests')
        .eq('id', user.id)
        .single()

      const dailyCap = profileResult.data?.daily_cap ?? 10
      interests = profileResult.data?.interests ?? []

      const now = new Date()
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

      const [articlesResult, lastRunResult, rejectedResult] = await Promise.all([
        supabase
          .from('articles')
          .select(
            'id, item_id, title, site_name, excerpt, reading_time_minutes, score, justification, is_serendipity, origin, scored_at, word_count, og_image_url, status'
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
        supabase
          .from('articles')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'rejected')
          .gte('scored_at', sevenDaysAgo),
      ])

      articles = articlesResult.data ?? []
      lastRefreshAt = lastRunResult.data?.completed_at ?? null
      rejectedCount = rejectedResult.count ?? 0

      // Sous-scores Q1/Q2/Q3 : stockes dans daily_ranking, pas sur articles.
      // Jointure cote appli via item_id pour alimenter le popover de pertinence.
      const itemIds = articles.map((a) => a.item_id).filter((id): id is string => id !== null)
      if (itemIds.length > 0) {
        const { data: rankingRows } = await supabase
          .from('daily_ranking')
          .select('item_id, q1_relevance, q2_unexpected, q3_discovery')
          .eq('user_id', user.id)
          .in('item_id', itemIds)
        for (const row of rankingRows ?? []) {
          subScoresByItemId.set(row.item_id, {
            q1: row.q1_relevance,
            q2: row.q2_unexpected,
            q3: row.q3_discovery,
          })
        }
      }
    }
  }

  // Passe une date ISO pour que FeedHeader formate selon la locale client
  const todayIso = new Date().toISOString()
  const topInterests = interests.slice(0, 3)

  // Fil unique : essentiels trie par score desc, puis serendipity trie par score desc
  const essentials = articles.filter((a) => !a.is_serendipity).sort(sortByScoreDesc)
  const surprises = articles.filter((a) => a.is_serendipity).sort(sortByScoreDesc)

  return (
    <div className="max-w-[720px] mx-auto px-4 py-3 md:py-10 w-full">
      <FeedHeader today={todayIso} lastRefreshAt={lastRefreshAt} topInterests={topInterests} />

      {/* Articles */}
      <DismissProvider>
        <FeedShell className="space-y-6">
          {articles.length === 0 ? (
            <EmptyFeed />
          ) : (
            <>
              {essentials.map((a, i) => (
                <ArticleCard
                  key={a.id}
                  id={a.id}
                  staggerIndex={i}
                  title={a.title}
                  siteName={a.site_name}
                  excerpt={a.excerpt}
                  readingTimeMinutes={a.reading_time_minutes}
                  score={a.score}
                  justification={a.justification}
                  isSerendipity={a.is_serendipity}
                  origin={a.origin}
                  scoredAt={a.scored_at}
                  wordCount={a.word_count}
                  ogImageUrl={a.og_image_url}
                  isRead={a.status === 'read'}
                  subScores={a.item_id ? (subScoresByItemId.get(a.item_id) ?? null) : null}
                />
              ))}

              {surprises.length > 0 && (
                <div
                  className="flex items-center gap-3 py-2"
                  data-testid="discovery-divider"
                  aria-hidden="true"
                >
                  <span className="h-px flex-1 bg-border" />
                  <span className="font-ui text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Découverte
                  </span>
                  <span className="h-px flex-1 bg-border" />
                </div>
              )}

              {surprises.map((a, i) => (
                <ArticleCard
                  key={a.id}
                  id={a.id}
                  staggerIndex={essentials.length + i}
                  title={a.title}
                  siteName={a.site_name}
                  excerpt={a.excerpt}
                  readingTimeMinutes={a.reading_time_minutes}
                  score={a.score}
                  justification={a.justification}
                  isSerendipity={a.is_serendipity}
                  origin={a.origin}
                  scoredAt={a.scored_at}
                  wordCount={a.word_count}
                  ogImageUrl={a.og_image_url}
                  isRead={a.status === 'read'}
                  subScores={a.item_id ? (subScoresByItemId.get(a.item_id) ?? null) : null}
                />
              ))}
            </>
          )}
        </FeedShell>
      </DismissProvider>

      {rejectedCount > 0 && (
        <div className="mt-8 pt-4 border-t border-border">
          <Link
            href="/library?tab=filtered"
            className="font-ui text-xs text-muted-foreground hover:text-accent transition-colors"
          >
            {rejectedCount} article{rejectedCount > 1 ? 's' : ''} filtre
            {rejectedCount > 1 ? 's' : ''} cette semaine
          </Link>
        </div>
      )}
    </div>
  )
}
