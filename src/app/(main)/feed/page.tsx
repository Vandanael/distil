import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { ArticleCard } from './components/ArticleCard'
import { EmptyEssential } from './components/EmptyEssential'
import { EmptyFeed } from './components/EmptyFeed'
import { FirstEditionEmpty } from './components/FirstEditionEmpty'
import { FeedShell } from './components/FeedShell'
import { FeedHeader } from './components/FeedHeader'
import { DismissProvider } from './components/DismissContext'
import { FeedPoolProvider, POOL_RESERVE_SIZE } from './components/FeedPoolContext'
import { KeywordSection, type KeywordGroup } from './components/KeywordSection'

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
  published_at: string | null
  scored_at: string | null
  word_count: number | null
  og_image_url: string | null
  status: string
  below_normal_threshold: boolean
  carry_over_count: number
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
  let keywordGroups: KeywordGroup[] = []
  let daysSinceLastLogin: number | undefined = undefined
  let firstEditionEmpty = false
  let dailyCapResolved = 10
  const subScoresByItemId = new Map<string, SubScores>()
  const sourceKindByItemId = new Map<string, 'rss' | 'agent'>()
  const bucketByItemId = new Map<string, 'essential' | 'surprise'>()

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const profileResult = await supabase
        .from('profiles')
        .select('daily_cap, interests, display_interests, first_edition_empty')
        .eq('id', user.id)
        .single()

      const dailyCap = profileResult.data?.daily_cap ?? 10
      dailyCapResolved = dailyCap
      const rawInterests: string[] = profileResult.data?.display_interests ?? profileResult.data?.interests ?? []
      interests = rawInterests
      firstEditionEmpty = profileResult.data?.first_edition_empty ?? false

      const now = new Date()
      const todayStart = new Date(now)
      todayStart.setHours(0, 0, 0, 0)
      const todayStartISO = todayStart.toISOString()

      const [articlesResult, lastRunResult] = await Promise.all([
        supabase
          .from('articles')
          .select(
            'id, item_id, title, site_name, excerpt, reading_time_minutes, score, justification, is_serendipity, origin, published_at, scored_at, word_count, og_image_url, status, below_normal_threshold, carry_over_count'
          )
          .eq('user_id', user.id)
          .in('status', ['pending', 'read'])
          .gte('last_shown_in_edition_at', todayStartISO)
          .order('score', { ascending: false, nullsFirst: false })
          .limit(dailyCap + POOL_RESERVE_SIZE),
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
      // Sépare les articles visibles de la réserve (au-delà de dailyCap)
      // articles est déjà trié par score desc côté Supabase
      lastRefreshAt = lastRunResult.data?.completed_at ?? null

      // Bannière retour d'absence : lecture via service role (auth.users)
      const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      if (serviceUrl && serviceKey) {
        try {
          const adminClient = createServiceClient(serviceUrl, serviceKey)
          const { data: adminUser } = await adminClient.auth.admin.getUserById(user.id)
          const lastSignIn = adminUser?.user?.last_sign_in_at
          if (lastSignIn) {
            const diffMs = Date.now() - new Date(lastSignIn).getTime()
            daysSinceLastLogin = Math.floor(diffMs / (1000 * 60 * 60 * 24))
          }
        } catch {
          // Non bloquant
        }
      }

      // Section "Tous vos mots-cles" : items des 48h matchant un keyword de l'user
      // et qui ne sont pas dans le feed (NOT EXISTS articles, cote RPC).
      if (interests.length > 0) {
        const cutoff = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString()
        const { data: hitsRows } = await supabase.rpc('list_keyword_hits', {
          target_user_id: user.id,
          cutoff_time: cutoff,
        })
        if (hitsRows) {
          const groupMap = new Map<string, KeywordGroup>()
          for (const row of hitsRows) {
            const existing = groupMap.get(row.keyword)
            const hit = {
              itemId: row.item_id,
              url: row.url,
              title: row.title,
              siteName: row.site_name,
              publishedAt: row.published_at,
              wordCount: row.word_count,
            }
            if (existing) {
              existing.hits.push(hit)
            } else {
              groupMap.set(row.keyword, { keyword: row.keyword, hits: [hit] })
            }
          }
          keywordGroups = Array.from(groupMap.values()).sort(
            (a, b) => b.hits.length - a.hits.length
          )
        }
      }

      // Sous-scores Q1/Q2/Q3 : stockes dans daily_ranking, pas sur articles.
      // Jointure cote appli via item_id pour alimenter le popover de pertinence.
      const itemIds = articles.map((a) => a.item_id).filter((id): id is string => id !== null)
      if (itemIds.length > 0) {
        const [rankingResult, itemsResult] = await Promise.all([
          supabase
            .from('daily_ranking')
            .select('item_id, bucket, q1_relevance, q2_unexpected, q3_discovery')
            .eq('user_id', user.id)
            .in('item_id', itemIds),
          // Remonte feeds.kind pour distinguer les items RSS des items agent (badge Decouverte).
          supabase.from('items').select('id, feeds(kind)').in('id', itemIds),
        ])
        for (const row of rankingResult.data ?? []) {
          if (row.bucket === 'essential' || row.bucket === 'surprise') {
            bucketByItemId.set(row.item_id, row.bucket)
          }
          subScoresByItemId.set(row.item_id, {
            q1: row.q1_relevance,
            q2: row.q2_unexpected,
            q3: row.q3_discovery,
          })
        }
        for (const row of itemsResult.data ?? []) {
          // Supabase PostgREST type la relation parent en array, un seul element attendu (FK 1:1).
          const feedsRel = row.feeds as { kind: string } | { kind: string }[] | null
          const feed = Array.isArray(feedsRel) ? feedsRel[0] : feedsRel
          if (feed?.kind === 'rss' || feed?.kind === 'agent') {
            sourceKindByItemId.set(row.id, feed.kind)
          }
        }
      }
    }
  }

  const topInterests = interests.slice(0, 3)

  // Sépare les articles visibles (dailyCap) de la réserve pour le remplacement dynamique.
  // articles est trié score desc : les premiers sont les meilleurs.
  const visibleArticles = articles.slice(0, dailyCapResolved)
  const reserveArticles = articles.slice(dailyCapResolved)
  const reserveIds = reserveArticles.map((a) => a.id)

  const hasLightHarvest = visibleArticles.some((a) => a.below_normal_threshold)

  // Fil unique : essentiels trie par score desc, puis serendipity trie par score desc
  const essentials = visibleArticles.filter((a) => !a.is_serendipity).sort(sortByScoreDesc)
  const surprises = visibleArticles.filter((a) => a.is_serendipity).sort(sortByScoreDesc)

  return (
    <div className="max-w-[720px] lg:max-w-[1160px] mx-auto px-4 py-3 md:py-10 w-full">
      <FeedHeader
        lastRefreshAt={lastRefreshAt}
        topInterests={topInterests}
        hasLightHarvest={hasLightHarvest}
        daysSinceLastLogin={daysSinceLastLogin}
      />

      {/* Articles : colonne unique jusqu'a lg, grille 2-col au-dela */}
      <FeedPoolProvider reserveIds={reserveIds}>
      <DismissProvider>
        <FeedShell
          className="space-y-2 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-x-10 lg:gap-y-2"
          articleStatuses={visibleArticles.map((a) => a.status)}
        >
          {firstEditionEmpty ? (
            <div className="lg:col-span-2">
              <FirstEditionEmpty />
            </div>
          ) : visibleArticles.length === 0 ? (
            <div className="lg:col-span-2">
              <EmptyFeed />
            </div>
          ) : (
            <>
              {essentials.length === 0 && surprises.length > 0 && (
                <EmptyEssential />
              )}

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
                  bucket={a.item_id ? (bucketByItemId.get(a.item_id) ?? null) : null}
                  sourceKind={a.item_id ? (sourceKindByItemId.get(a.item_id) ?? null) : null}
                  publishedAt={a.published_at}
                  scoredAt={a.scored_at}
                  wordCount={a.word_count}
                  ogImageUrl={a.og_image_url}
                  isRead={a.status === 'read'}
                  subScores={a.item_id ? (subScoresByItemId.get(a.item_id) ?? null) : null}
                  carryOverCount={a.carry_over_count}
                />
              ))}

              {surprises.length > 0 && (
                <div
                  className="flex items-center gap-3 py-2 lg:col-span-2 lg:mt-4"
                  data-testid="discovery-divider"
                  aria-hidden="true"
                >
                  <span className="h-px flex-1 bg-border" />
                  <span className="font-ui text-sm uppercase tracking-[0.16em] text-muted-foreground">
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
                  bucket={a.item_id ? (bucketByItemId.get(a.item_id) ?? null) : null}
                  sourceKind={a.item_id ? (sourceKindByItemId.get(a.item_id) ?? null) : null}
                  publishedAt={a.published_at}
                  scoredAt={a.scored_at}
                  wordCount={a.word_count}
                  ogImageUrl={a.og_image_url}
                  isRead={a.status === 'read'}
                  subScores={a.item_id ? (subScoresByItemId.get(a.item_id) ?? null) : null}
                  carryOverCount={a.carry_over_count}
                />
              ))}

              {reserveArticles.map((a, i) => (
                <ArticleCard
                  key={a.id}
                  id={a.id}
                  staggerIndex={essentials.length + surprises.length + i}
                  title={a.title}
                  siteName={a.site_name}
                  excerpt={a.excerpt}
                  readingTimeMinutes={a.reading_time_minutes}
                  score={a.score}
                  justification={a.justification}
                  isSerendipity={a.is_serendipity}
                  origin={a.origin}
                  bucket={a.item_id ? (bucketByItemId.get(a.item_id) ?? null) : null}
                  sourceKind={a.item_id ? (sourceKindByItemId.get(a.item_id) ?? null) : null}
                  publishedAt={a.published_at}
                  scoredAt={a.scored_at}
                  wordCount={a.word_count}
                  ogImageUrl={a.og_image_url}
                  isRead={a.status === 'read'}
                  subScores={a.item_id ? (subScoresByItemId.get(a.item_id) ?? null) : null}
                  carryOverCount={a.carry_over_count}
                  isReserve={true}
                />
              ))}
            </>
          )}
        </FeedShell>
      </DismissProvider>
      </FeedPoolProvider>

      <KeywordSection groups={keywordGroups} />
    </div>
  )
}
