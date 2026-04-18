'use client'

import { scoreColorClass } from '@/lib/utils'

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
    header: "L'Édition du jour",
    relevance: 'Pertinence',
    discovery: 'Découverte',
    noTitle: 'Sans titre',
    empty: 'Le flux arrive.',
  },
  en: {
    header: "Today's Edition",
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
    <div className="border-l border-border pl-8 space-y-6">
      <div className="space-y-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {today}
        </p>
        <h2 className="font-display text-3xl italic text-foreground leading-none">{t.header}</h2>
      </div>
      {articles.length === 0 ? (
        <p className="font-body text-sm text-muted-foreground italic py-4">{t.empty}</p>
      ) : (
        <ul className="space-y-6">
          {articles.slice(0, 3).map((article, i) => {
            const inner = (
              <div className="space-y-1.5">
                {article.site_name && (
                  <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    {article.site_name}
                  </p>
                )}
                <h3 className="font-display text-[19px] leading-[1.2] text-foreground group-hover:text-accent transition-colors">
                  {article.title ?? t.noTitle}
                </h3>
                {article.score !== null && (
                  <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground pt-0.5">
                    {article.is_serendipity && (
                      <span className="text-accent mr-2">{t.discovery}</span>
                    )}
                    {t.relevance}{' '}
                    <span
                      className={`tabular-nums font-semibold ${scoreColorClass(article.score)}`}
                    >
                      {Math.round(article.score)}
                    </span>
                  </p>
                )}
              </div>
            )
            return (
              <li
                key={article.url ?? String(i)}
                className="pb-6 border-b border-border last:border-0 last:pb-0"
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
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
