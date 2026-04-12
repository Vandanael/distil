'use client'

import Link from 'next/link'
import Image from 'next/image'
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
  justification: string | null
  isSerendipity: boolean
  origin: string
  scoredAt: string | null
  wordCount: number | null
  ogImageUrl: string | null
  isRead?: boolean
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
  isRead = false,
  staggerIndex = 0,
}: Props) {
  const [dismissed, setDismissed] = useState(false)
  const [showScorePopover, setShowScorePopover] = useState(false)
  const [positiveSignalSent, setPositiveSignalSent] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [isDismissing, startDismissTransition] = useTransition()
  const scorePopoverRef = useRef<HTMLDivElement>(null)
  const undoRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cancelledRef = useRef(false)
  const relativeDate = formatRelativeDate(scoredAt)
  const isPaywall = wordCount === 0
  // Les 3 premieres cartes sont potentiellement above-the-fold
  const isAboveFold = staggerIndex < 3

  useEffect(() => {
    return () => {
      if (undoRef.current) clearTimeout(undoRef.current)
    }
  }, [])

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

  function handleDismiss() {
    const reason = isRead ? 'already_read' : 'off_topic'
    setDismissed(true)
    cancelledRef.current = false
    if (undoRef.current) clearTimeout(undoRef.current)

    toast.success('Article masque', {
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
      className="group relative block py-5 -mx-3 px-3 transition-colors hover:bg-muted/40"
      data-testid={`article-card-${id}`}
      data-article-card
      style={{ '--stagger': staggerIndex } as React.CSSProperties}
    >
      {/* Ligne meta : source · date · duree */}
      <div className="flex items-center gap-1.5 mb-1.5 text-[13px] text-muted-foreground">
        {origin === 'bookmarklet' && (
          <span
            className="text-accent shrink-0"
            data-testid={`origin-badge-${id}`}
            title="Sauvegarde par vous"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          </span>
        )}
        {siteName && (
          <span className="font-ui">{siteName}</span>
        )}
        {siteName && relativeDate && <span>·</span>}
        {relativeDate && (
          <span className="font-ui">{relativeDate}</span>
        )}
        {readingTimeMinutes && (
          <>
            <span>·</span>
            <span className="font-ui">{readingTimeMinutes} min</span>
          </>
        )}
        {isPaywall && (
          <>
            <span>·</span>
            <span
              className="text-destructive/70"
              data-testid={`paywall-badge-${id}`}
              title="Contenu non accessible - article probablement derriere un paywall"
            >
              Paywall
            </span>
          </>
        )}
      </div>

      {/* Ligne 3-4 : titre + thumbnail */}
      <div className="flex items-start gap-5">
        <div className="flex-1 min-w-0">
          <h2 className={`font-ui text-xl font-bold leading-snug group-hover:text-accent transition-colors duration-150${isPaywall ? ' line-through decoration-muted-foreground/40' : ''}${isRead ? ' text-muted-foreground' : ' text-foreground'}`}>
            {title ?? 'Sans titre'}
          </h2>
          {excerpt && !isPaywall && (
            <p className="font-body text-[15px] text-muted-foreground line-clamp-2 leading-relaxed mt-1">
              {excerpt}
            </p>
          )}
        </div>

        {ogImageUrl && !imageError && (
          <div className="relative shrink-0 w-28 h-20 sm:w-32 sm:h-24 overflow-hidden bg-muted">
            <Image
              src={ogImageUrl}
              alt=""
              fill
              sizes="128px"
              className="object-cover"
              loading={isAboveFold ? 'eager' : 'lazy'}
              priority={isAboveFold}
              onError={() => setImageError(true)}
            />
          </div>
        )}
      </div>

      {/* Ligne 5 : tags + score + actions */}
      <div className="flex items-center gap-3 mt-2">
        {/* Tags Distil */}
        {isSerendipity && (
          <span
            className="font-ui text-[13px] text-accent cursor-help"
            data-testid={`serendipity-badge-${id}`}
            title="Article hors de vos sources habituelles - introduit pour elargir votre veille"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              toast.info('Article hors de vos sources habituelles - introduit pour elargir votre veille.')
            }}
          >
            Decouverte
          </span>
        )}

        {/* Score : label + nombre cliquable */}
        {score !== null && (
          <div className="relative" ref={scorePopoverRef}>
            <button
              type="button"
              data-testid={`score-${id}`}
              aria-label={`Pertinence : ${Math.round(score)}/100. Cliquer pour details.`}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setShowScorePopover((v) => !v)
              }}
              className="font-ui text-[13px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Pertinence <span className="font-semibold tabular-nums">{Math.round(score)}%</span>
            </button>
            {showScorePopover && (
              <div
                role="dialog"
                aria-label="Detail du score"
                className="absolute left-0 bottom-7 z-20 border border-border bg-background shadow-sm w-64 p-3 space-y-2 animate-in fade-in slide-in-from-bottom-1 duration-150"
                onClick={(e) => e.preventDefault()}
              >
                <div className="flex items-baseline justify-between">
                  <span className="font-ui text-[13px] font-semibold text-foreground">
                    Pertinence
                  </span>
                  <span className="font-ui text-xl font-semibold tabular-nums text-foreground">
                    {Math.round(score)}<span className="text-[13px] text-muted-foreground font-normal">%</span>
                  </span>
                </div>
                {justification && (
                  <p className="font-body text-[13px] text-muted-foreground leading-relaxed">
                    {justification}
                  </p>
                )}
                {isSerendipity && (
                  <p className="font-ui text-[13px] text-accent">
                    Decouverte - article hors de vos sources habituelles.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Actions a droite */}
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={handlePositiveSignal}
            disabled={positiveSignalSent}
            aria-label="Plus comme ca"
            data-testid={`signal-${id}`}
            className="font-ui text-[13px] text-muted-foreground/60 transition-colors p-1.5 hover:text-accent hover:bg-muted disabled:text-accent disabled:opacity-50"
            title="Plus comme ca"
          >
            {positiveSignalSent ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/></svg>
            )}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleDismiss()
            }}
            disabled={isDismissing}
            aria-label="Masquer cet article"
            data-testid={`dismiss-${id}`}
            className="font-ui text-muted-foreground/60 transition-colors p-1.5 hover:text-destructive hover:bg-muted disabled:opacity-20"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
          </button>
        </div>
      </div>
    </Link>
  )
}
