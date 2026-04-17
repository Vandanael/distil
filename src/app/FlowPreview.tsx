'use client'

type FeaturedArticle = {
  title: string | null
  url: string | null
  site_name: string | null
  excerpt: string | null
  score: number | null
  is_serendipity: boolean
}

const COPY = {
  fr: {
    header: 'Ce matin dans Distil',
    relevance: 'Pertinence',
    discovery: 'Découverte',
    noTitle: 'Sans titre',
    empty: 'Le flux arrive.',
  },
  en: {
    header: 'This morning in Distil',
    relevance: 'Relevance',
    discovery: 'Discovery',
    noTitle: 'No title',
    empty: 'Flow incoming.',
  },
}

type Props = { articles: FeaturedArticle[]; lang: 'fr' | 'en' }

export function FlowPreview({ articles, lang }: Props) {
  const t = COPY[lang]
  const today = new Date().toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', {
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="border border-border bg-card p-6 space-y-5">
      <div className="flex items-baseline justify-between border-b border-border pb-3">
        <p className="font-ui text-[13px] font-semibold text-foreground">{t.header}</p>
        <p className="font-ui text-xs text-muted-foreground capitalize">{today}</p>
      </div>
      {articles.length === 0 ? (
        <p className="font-body text-sm text-muted-foreground italic py-6 text-center">{t.empty}</p>
      ) : (
        <div className="space-y-5">
          {articles.slice(0, 3).map((article, i) => {
            const inner = (
              <div className="space-y-1.5">
                {article.site_name && (
                  <p className="font-ui text-xs text-muted-foreground">{article.site_name}</p>
                )}
                <h3 className="font-ui text-[15px] font-bold leading-snug text-foreground group-hover:text-accent transition-colors">
                  {article.title ?? t.noTitle}
                </h3>
                {article.score !== null && (
                  <p className="font-ui text-[11px] text-muted-foreground">
                    {article.is_serendipity && (
                      <span className="text-accent mr-1.5">{t.discovery}</span>
                    )}
                    {t.relevance}{' '}
                    <span className="font-semibold tabular-nums">{Math.round(article.score)}%</span>
                  </p>
                )}
              </div>
            )
            return (
              <div
                key={article.url ?? String(i)}
                className="pb-5 border-b border-border last:border-0 last:pb-0"
              >
                {article.url ? (
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block"
                  >
                    {inner}
                  </a>
                ) : (
                  inner
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
