import { ArticleCard } from './ArticleCard'

type Article = {
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
}

type Props = {
  title: string
  subtitle: string
  articles: Article[]
  showScores: boolean
  staggerOffset?: number
}

export function BucketSection({ title, subtitle, articles, showScores, staggerOffset = 0 }: Props) {
  if (articles.length === 0) return null

  return (
    <section>
      <div className="mb-4 pt-2">
        <h2 className="font-ui text-sm font-semibold tracking-wide uppercase text-foreground">
          {title}
        </h2>
        <p className="font-ui text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
      <div className="space-y-8">
        {articles.map((a, i) => (
          <ArticleCard
            key={a.id}
            id={a.id}
            staggerIndex={staggerOffset + i}
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
        ))}
      </div>
    </section>
  )
}
