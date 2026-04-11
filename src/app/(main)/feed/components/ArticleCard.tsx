'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { dismissArticle } from '../../article/[id]/actions'

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
  wordCount: number | null
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
  wordCount,
}: Props) {
  const [hovered, setHovered] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [isDismissing, startDismissTransition] = useTransition()
  const relativeDate = formatRelativeDate(scoredAt)
  const isPaywall = wordCount === null || wordCount === 0

  if (dismissed) return null

  function handleDismiss(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    startDismissTransition(async () => {
      await dismissArticle(id)
      setDismissed(true)
      toast.success('Article masqué')
    })
  }

  return (
    <Link
      href={`/article/${id}`}
      className="group relative block space-y-2 border-b border-border pb-6 last:border-0"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      data-testid={`article-card-${id}`}
    >
      <div className="flex items-start justify-between gap-4">
        <h2 className="font-ui text-base font-semibold text-foreground leading-snug group-hover:text-accent transition-colors">
          {title ?? 'Sans titre'}
        </h2>
        <div className="flex items-center gap-3 shrink-0">
          {score !== null && (
            <span
              className={[
                'font-ui text-xs tabular-nums transition-opacity',
                hovered ? 'opacity-100 text-accent' : 'opacity-0',
              ].join(' ')}
              data-testid={`score-${id}`}
            >
              {score}
            </span>
          )}
          <button
            type="button"
            onClick={handleDismiss}
            disabled={isDismissing}
            aria-label="Masquer cet article"
            data-testid={`dismiss-${id}`}
            className={[
              'font-ui text-base leading-none text-muted-foreground/40 transition-opacity hover:text-muted-foreground disabled:opacity-20',
              hovered ? 'opacity-100' : 'opacity-0',
            ].join(' ')}
          >
            ×
          </button>
        </div>
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
            title="Article hors de vos habituelles — introduit pour elargir votre veille"
          >
            Découverte
          </span>
        )}
        {isPaywall && (
          <span
            className="font-ui text-[11px] uppercase tracking-wider text-muted-foreground/50"
            data-testid={`paywall-badge-${id}`}
            title="Contenu non accessible — article probablement derriere un paywall"
          >
            Paywall
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
