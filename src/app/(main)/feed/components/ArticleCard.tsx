'use client'

import Link from 'next/link'
import { useState } from 'react'

type Props = {
  id: string
  title: string | null
  siteName: string | null
  excerpt: string | null
  readingTimeMinutes: number | null
  score: number | null
  isSerendipity: boolean
  origin: string
}

export function ArticleCard({
  id,
  title,
  siteName,
  excerpt,
  readingTimeMinutes,
  score,
  isSerendipity,
  origin,
}: Props) {
  const [hovered, setHovered] = useState(false)

  return (
    <Link
      href={`/article/${id}`}
      className="group block space-y-2 border-b border-border pb-6 last:border-0"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      data-testid={`article-card-${id}`}
    >
      <div className="flex items-start justify-between gap-4">
        <h2 className="font-ui text-base font-semibold text-foreground leading-snug group-hover:text-accent transition-colors">
          {title ?? 'Sans titre'}
        </h2>
        {score !== null && (
          <span
            className={[
              'shrink-0 font-ui text-xs tabular-nums transition-opacity',
              hovered ? 'opacity-100 text-accent' : 'opacity-0',
            ].join(' ')}
            data-testid={`score-${id}`}
          >
            {score}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {siteName && (
          <span className="font-ui text-[11px] uppercase tracking-wider text-muted-foreground">
            {siteName}
          </span>
        )}
        {readingTimeMinutes && (
          <span className="font-ui text-[11px] text-muted-foreground">
            {readingTimeMinutes} min
          </span>
        )}
        {isSerendipity && (
          <span
            className="font-ui text-[11px] uppercase tracking-wider text-accent"
            data-testid={`serendipity-badge-${id}`}
          >
            Découverte
          </span>
        )}
        {origin === 'bookmarklet' && (
          <span
            className="font-ui text-[11px] uppercase tracking-wider text-muted-foreground/60"
            data-testid={`origin-badge-${id}`}
          >
            Sauvegardé
          </span>
        )}
      </div>

      {excerpt && <p className="font-body text-sm text-muted-foreground line-clamp-2">{excerpt}</p>}
    </Link>
  )
}
