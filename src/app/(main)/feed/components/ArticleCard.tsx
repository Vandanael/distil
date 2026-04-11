'use client'

import Link from 'next/link'
import { useRef, useState, useTransition, useEffect } from 'react'
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
  const [dismissed, setDismissed] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [isDismissing, startDismissTransition] = useTransition()
  const feedbackRef = useRef<HTMLDivElement>(null)
  const undoRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cancelledRef = useRef(false)
  const relativeDate = formatRelativeDate(scoredAt)
  const isPaywall = wordCount === null || wordCount === 0

  // Nettoyage du timeout d'annulation au demontage
  useEffect(() => {
    return () => {
      if (undoRef.current) clearTimeout(undoRef.current)
    }
  }, [])

  // Ferme le popover si clic en dehors
  useEffect(() => {
    if (!showFeedback) return
    function onOutside(e: MouseEvent) {
      if (feedbackRef.current && !feedbackRef.current.contains(e.target as Node)) {
        setShowFeedback(false)
      }
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [showFeedback])

  if (dismissed) return null

  function handleDismiss(reason: 'off_topic' | 'already_read') {
    setShowFeedback(false)
    setDismissed(true)
    cancelledRef.current = false
    if (undoRef.current) clearTimeout(undoRef.current)

    const label = reason === 'off_topic' ? 'Article masque — signal envoye' : 'Article masque'
    toast.success(label, {
      action: {
        label: 'Annuler',
        onClick: () => {
          cancelledRef.current = true
          if (undoRef.current) clearTimeout(undoRef.current)
          setDismissed(false)
        },
      },
      duration: 4000,
    })

    // Execute le server action apres le delai (sauf si annule)
    undoRef.current = setTimeout(() => {
      if (!cancelledRef.current) {
        startDismissTransition(async () => {
          await dismissArticle(id, reason)
        })
      }
    }, 4000)
  }

  return (
    <Link
      href={`/article/${id}`}
      className="group relative block space-y-2 border-b border-border pb-6 last:border-0"
      data-testid={`article-card-${id}`}
    >
      <div className="flex items-start justify-between gap-4">
        <h2 className="font-ui text-base font-semibold text-foreground leading-snug group-hover:text-accent transition-colors">
          {title ?? 'Sans titre'}
        </h2>
        <div className="relative flex items-center gap-2 shrink-0" ref={feedbackRef}>
          {score !== null && (
            <span
              className="font-ui text-xs tabular-nums text-muted-foreground/50 cursor-help"
              title="Score de pertinence Distil (0-100)"
              data-testid={`score-${id}`}
            >
              {score}
            </span>
          )}
          {/* Bouton dismiss — toujours tappable, ouvre le popover de feedback */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setShowFeedback((v) => !v)
            }}
            disabled={isDismissing}
            aria-label="Masquer cet article"
            data-testid={`dismiss-${id}`}
            className="font-ui text-base leading-none text-muted-foreground/40 transition-colors hover:text-muted-foreground/70 disabled:opacity-20 p-1 -mr-1"
          >
            ×
          </button>
          {showFeedback && (
            <div
              className="absolute right-0 top-6 z-20 flex flex-col gap-0 border border-border bg-background shadow-sm min-w-[130px]"
              onClick={(e) => e.preventDefault()}
            >
              <button
                type="button"
                onClick={() => handleDismiss('off_topic')}
                className="px-3 py-2 text-left font-ui text-xs text-foreground hover:bg-muted transition-colors"
                data-testid={`feedback-off-topic-${id}`}
              >
                Hors sujet
              </button>
              <button
                type="button"
                onClick={() => handleDismiss('already_read')}
                className="px-3 py-2 text-left font-ui text-xs text-foreground hover:bg-muted transition-colors border-t border-border"
                data-testid={`feedback-already-read-${id}`}
              >
                Deja lu ailleurs
              </button>
            </div>
          )}
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
            className="font-ui text-[11px] uppercase tracking-wider text-accent cursor-help"
            data-testid={`serendipity-badge-${id}`}
            title="Article hors de vos sources habituelles — introduit pour elargir votre veille"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              toast.info('Article hors de vos sources habituelles — introduit pour elargir votre veille.')
            }}
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
