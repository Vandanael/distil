'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRef, useState, useTransition, useEffect } from 'react'
import { toast } from 'sonner'
import { dismissArticle } from '../../article/[id]/actions'

function MiniScoreBar({ score, onClick }: { score: number; onClick: (e: React.MouseEvent) => void }) {
  const color = score >= 70 ? 'bg-emerald-500' : score >= 40 ? 'bg-amber-400' : 'bg-red-400'
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Score de pertinence : ${score}/100. Cliquer pour details.`}
      className="h-1 w-10 bg-border overflow-hidden shrink-0 cursor-pointer hover:opacity-70 transition-opacity"
    >
      <div className={`h-full ${color}`} style={{ width: `${score}%` }} />
    </button>
  )
}

type Props = {
  id: string
  title: string | null
  siteName: string | null
  excerpt: string | null
  readingTimeMinutes: number | null
  score: number | null
  justification: string | null
  isSerendipity: boolean
  origin: string
  scoredAt: string | null
  wordCount: number | null
  ogImageUrl: string | null
  staggerIndex?: number
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
  justification,
  isSerendipity,
  origin,
  scoredAt,
  wordCount,
  ogImageUrl,
  staggerIndex = 0,
}: Props) {
  const [dismissed, setDismissed] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [showScorePopover, setShowScorePopover] = useState(false)
  const [positiveSignalSent, setPositiveSignalSent] = useState(false)
  const [isDismissing, startDismissTransition] = useTransition()
  const feedbackRef = useRef<HTMLDivElement>(null)
  const scorePopoverRef = useRef<HTMLDivElement>(null)
  const undoRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cancelledRef = useRef(false)
  const relativeDate = formatRelativeDate(scoredAt)
  const isPaywall = wordCount === null || wordCount === 0

  useEffect(() => {
    return () => {
      if (undoRef.current) clearTimeout(undoRef.current)
    }
  }, [])

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

  useEffect(() => {
    if (!showScorePopover) return
    function onOutside(e: MouseEvent) {
      if (scorePopoverRef.current && !scorePopoverRef.current.contains(e.target as Node)) {
        setShowScorePopover(false)
      }
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [showScorePopover])

  if (dismissed) return null

  function handleDismiss(reason: 'off_topic' | 'already_read') {
    setShowFeedback(false)
    setDismissed(true)
    cancelledRef.current = false
    if (undoRef.current) clearTimeout(undoRef.current)

    const label = reason === 'off_topic' ? 'Article masque - signal envoye' : 'Article masque'
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

    undoRef.current = setTimeout(() => {
      if (!cancelledRef.current) {
        startDismissTransition(async () => {
          await dismissArticle(id, reason)
        })
      }
    }, 4000)
  }

  async function handlePositiveSignal(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (positiveSignalSent) return
    setPositiveSignalSent(true)
    toast.success('Signal envoye - plus comme ca')
    await fetch(`/api/articles/${id}/signal`, { method: 'PATCH' })
  }

  return (
    <Link
      href={`/article/${id}`}
      className="group relative block space-y-2 border-b border-border pb-6 last:border-0"
      data-testid={`article-card-${id}`}
      data-article-card
      style={{ '--stagger': staggerIndex } as React.CSSProperties}
    >
      <div className="flex items-start justify-between gap-4">
        <h2 className="font-ui text-base font-semibold text-foreground leading-snug group-hover:text-accent group-hover:translate-x-0.5 transition-all duration-150">
          {title ?? 'Sans titre'}
        </h2>
        <div className="flex items-center gap-2 shrink-0">
          {/* Score popover */}
          {score !== null && (
            <div className="relative" ref={scorePopoverRef}>
              <span data-testid={`score-${id}`}>
                <MiniScoreBar
                  score={score}
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setShowScorePopover((v) => !v)
                    setShowFeedback(false)
                  }}
                />
              </span>
              {showScorePopover && (
                <div
                  className="absolute right-0 top-5 z-20 border border-border bg-background shadow-sm w-64 p-3 space-y-2"
                  onClick={(e) => e.preventDefault()}
                >
                  <div className="flex items-baseline justify-between">
                    <span className="font-ui text-xs font-semibold text-foreground">
                      Score
                    </span>
                    <span className="font-ui text-xl font-semibold tabular-nums text-foreground">
                      {Math.round(score)}<span className="text-xs text-muted-foreground font-normal">/100</span>
                    </span>
                  </div>
                  {justification && (
                    <p className="font-body text-xs text-muted-foreground leading-relaxed">
                      {justification}
                    </p>
                  )}
                  {isSerendipity && (
                    <p className="font-ui text-[11px] text-accent">
                      Decouverte - article hors de vos sources habituelles.
                    </p>
                  )}
                  <Link
                    href="/rejected"
                    className="block font-ui text-[11px] text-muted-foreground hover:text-accent transition-colors pt-1 border-t border-border"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Voir les articles rejetes &rarr;
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Bouton plus comme ca */}
          <button
            type="button"
            onClick={handlePositiveSignal}
            disabled={positiveSignalSent}
            aria-label="Plus comme ca"
            data-testid={`signal-${id}`}
            className="font-ui text-sm leading-none transition-colors p-1 disabled:opacity-30 text-muted-foreground/30 hover:text-accent"
            title="Plus comme ca"
          >
            +
          </button>

          {/* Bouton dismiss */}
          <div className="relative" ref={feedbackRef}>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setShowFeedback((v) => !v)
                setShowScorePopover(false)
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
            title="Article hors de vos sources habituelles - introduit pour elargir votre veille"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              toast.info('Article hors de vos sources habituelles - introduit pour elargir votre veille.')
            }}
          >
            Découverte
          </span>
        )}
        {isPaywall && (
          <span
            className="font-ui text-[11px] uppercase tracking-wider text-muted-foreground/50"
            data-testid={`paywall-badge-${id}`}
            title="Contenu non accessible - article probablement derriere un paywall"
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

      {ogImageUrl && (
        <div className="relative w-full aspect-[2/1] overflow-hidden mt-1">
          <Image
            src={ogImageUrl}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 672px"
            className="object-cover"
            onError={(e) => {
              ;(e.currentTarget as HTMLImageElement).style.display = 'none'
            }}
          />
        </div>
      )}
      {excerpt && <p className="font-body text-sm text-muted-foreground line-clamp-2">{excerpt}</p>}
    </Link>
  )
}
