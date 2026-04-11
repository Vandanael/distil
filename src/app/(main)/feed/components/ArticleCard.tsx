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
  scoredAt: string | null
}

function formatRelativeDate(dateStr: string | null): string | null {
  if (!dateStr) return null
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return null
  const diffMs = Date.now() - date.getTime()
  const diffH = Math.floor(diffMs / (1000 * 60 * 60))
  if (diffH < 1) return "a l'instant"
  if (diffH < 24) return `il y a ${diffH}h`
  const diffD = Math.floor(diffH / 24)
  if (diffD === 1) return 'hier'
  if (diffD < 7) return `il y a ${diffD}j`
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
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
  scoredAt,
}: Props) {
  const [hovered, setHovered] = useState(false)
  const relativeDate = formatRelativeDate(scoredAt)

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
        {relativeDate && (
          <span className="font-ui text-[11px] text-muted-foreground/60 ml-auto">
            {relativeDate}
          </span>
        )}
      </div>

      {excerpt && <p className="font-body text-sm text-muted-foreground line-clamp-2">{excerpt}</p>}
    </Link>
  )
}
