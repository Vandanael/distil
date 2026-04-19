import { scoreColorClass } from '@/lib/utils'

type Article = {
  title: string | null
  url?: string | null
  site_name: string | null
  excerpt: string | null
  score: number | null
  is_serendipity: boolean
  justification?: string | null
  reading_time_minutes?: number | null
}

type Props = {
  article: Article
  lang?: 'fr' | 'en'
  noTitleLabel?: string
  serendipityLabel?: string
  relevanceLabel?: string
  compact?: boolean
}

export function ArticleRow({
  article,
  noTitleLabel = 'Sans titre',
  serendipityLabel = 'Decouverte',
  relevanceLabel = 'Pertinence',
  compact = false,
}: Props) {
  const inner = (
    <div className={compact ? 'space-y-1.5' : 'space-y-2'}>
      {article.site_name && (
        <p className="font-ui text-[14px] text-subtle">
          {article.site_name}
          {article.reading_time_minutes != null && (
            <span className="text-subtle/60"> · {article.reading_time_minutes} min</span>
          )}
        </p>
      )}
      <h3
        className={`font-ui font-bold text-foreground group-hover:text-accent transition-colors ${
          compact ? 'text-[18px] leading-[1.25]' : 'text-[20px] leading-[1.25]'
        }`}
      >
        {article.title ?? noTitleLabel}
      </h3>
      {article.excerpt && !compact && (
        <p className="font-body text-[15px] text-subtle line-clamp-2 leading-[1.55]">
          {article.excerpt}
        </p>
      )}
      {article.score !== null && (
        <p
          className="font-ui text-[14px] text-subtle pt-0.5"
          title={article.justification ?? undefined}
        >
          {article.is_serendipity && <span className="text-accent mr-2">{serendipityLabel}</span>}
          {relevanceLabel}{' '}
          <span className={`tabular-nums font-semibold ${scoreColorClass(article.score)}`}>
            {Math.round(article.score)}%
          </span>
        </p>
      )}
    </div>
  )

  const wrapperClass = compact ? 'py-4 border-b border-border last:border-0' : 'py-6 border-b border-border last:border-0'

  return (
    <li className={wrapperClass}>
      {article.url ? (
        <a href={article.url} target="_blank" rel="noopener noreferrer" className="group block">
          {inner}
        </a>
      ) : (
        <div>{inner}</div>
      )}
    </li>
  )
}
