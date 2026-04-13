'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRef, useState, useTransition, useEffect } from 'react'
import { toast } from 'sonner'
import { dismissArticle } from '@/app/(main)/article/[id]/actions'
import { useSwipeToDismiss } from '@/lib/hooks/useSwipeToDismiss'
import { useLocale } from '@/lib/i18n/context'
import { useDismissContext } from './DismissContext'

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

function formatRelativeDate(dateStr: string | null, locale: 'fr' | 'en'): string | null {
  if (!dateStr) return null
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return null
  const diffMs = Date.now() - date.getTime()
  const diffH = Math.floor(diffMs / (1000 * 60 * 60))
  const isFr = locale === 'fr'
  if (diffH < 1) return isFr ? "à l'instant" : 'just now'
  if (diffH < 24) return isFr ? `il y a ${diffH}h` : `${diffH}h ago`
  const diffD = Math.floor(diffH / 24)
  if (diffD === 1) return isFr ? 'hier' : 'yesterday'
  if (diffD < 7) return isFr ? `il y a ${diffD}j` : `${diffD}d ago`
  return date.toLocaleDateString(isFr ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short' })
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
  const { locale, t } = useLocale()
  const { dismissedIds } = useDismissContext()
  const [dismissed, setDismissed] = useState(false)
  const [showScorePopover, setShowScorePopover] = useState(false)
  const [positiveSignalSent, setPositiveSignalSent] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [isDismissing, startDismissTransition] = useTransition()
  const scorePopoverRef = useRef<HTMLDivElement>(null)
  const undoRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cancelledRef = useRef(false)
  const relativeDate = formatRelativeDate(scoredAt, locale)
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
    const popover = scorePopoverRef.current
    if (!popover) return

    const focusable = popover.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    first?.focus()

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setShowScorePopover(false)
        return
      }
      if (e.key !== 'Tab') return
      if (focusable.length === 0) {
        e.preventDefault()
        return
      }
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last?.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first?.focus()
        }
      }
    }

    function onOutside(e: MouseEvent) {
      if (popover && !popover.contains(e.target as Node)) {
        setShowScorePopover(false)
      }
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('mousedown', onOutside)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('mousedown', onOutside)
      ;(document.querySelector(`[data-testid="score-${id}"]`) as HTMLElement | null)?.focus()
    }
  }, [showScorePopover, id])

  const { handlers: swipeHandlers, style: swipeStyle } = useSwipeToDismiss({
    onDismiss: () => handleDismiss(),
    enabled: !dismissed,
  })

  if (dismissed || dismissedIds.has(id)) return null

  function handleDismiss() {
    const reason = isRead ? 'already_read' : 'off_topic'
    setDismissed(true)
    cancelledRef.current = false
    if (undoRef.current) clearTimeout(undoRef.current)

    toast.success(t.article.dismissed, {
      action: {
        label: t.article.undo,
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
    try {
      const res = await fetch(`/api/articles/${id}/signal`, { method: 'PATCH' })
      if (!res.ok) throw new Error()
      toast.success(t.article.positiveSent)
    } catch {
      setPositiveSignalSent(false)
      toast.error(locale === 'fr' ? "Erreur lors de l'envoi du signal." : 'Error sending signal.')
    }
  }

  return (
    <Link
      href={`/article/${id}`}
      className="group relative block py-5 -mx-3 px-3 transition-colors hover:bg-muted/40"
      data-testid={`article-card-${id}`}
      data-article-card
      data-article-id={id}
      style={{ '--stagger': staggerIndex, ...swipeStyle } as React.CSSProperties}
      {...swipeHandlers}
    >
      {/* Ligne meta : source · date · duree */}
      <div className="flex items-center gap-1.5 mb-1.5 text-[13px] text-muted-foreground">
        {origin === 'bookmarklet' && (
          <span
            className="text-accent shrink-0"
            data-testid={`origin-badge-${id}`}
            title="Sauvegarde par vous"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
              stroke="none"
              aria-hidden="true"
            >
              <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </span>
        )}
        {siteName && <span className="font-ui">{siteName}</span>}
        {siteName && relativeDate && <span>·</span>}
        {relativeDate && <span className="font-ui">{relativeDate}</span>}
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
          <h2
            className={`font-ui text-xl font-bold leading-snug group-hover:text-accent transition-colors duration-150${isPaywall ? ' line-through decoration-muted-foreground/40' : ''}${isRead ? ' text-muted-foreground' : ' text-foreground'}`}
          >
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
            title={t.article.serendipityTitle}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              toast.info(t.article.serendipityTitle)
            }}
          >
            {t.article.serendipity}
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
                aria-label="Détail du score"
                aria-modal="true"
                className="absolute left-0 bottom-7 z-20 border border-border bg-background shadow-sm w-64 p-3 space-y-2 animate-in fade-in slide-in-from-bottom-1 duration-150"
                onClick={(e) => e.preventDefault()}
              >
                <div className="flex items-baseline justify-between">
                  <span className="font-ui text-[13px] font-semibold text-foreground">
                    Pertinence
                  </span>
                  <span className="font-ui text-xl font-semibold tabular-nums text-foreground">
                    {Math.round(score)}
                    <span className="text-[13px] text-muted-foreground font-normal">%</span>
                  </span>
                </div>
                {justification && (
                  <p className="font-body text-[13px] text-muted-foreground leading-relaxed">
                    {justification}
                  </p>
                )}
                {isSerendipity && (
                  <p className="font-ui text-[13px] text-accent">{t.article.serendipityDetail}</p>
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
            aria-label="Plus comme ça"
            data-testid={`signal-${id}`}
            className="font-ui text-[13px] text-muted-foreground/60 transition-colors p-1.5 hover:text-accent hover:bg-muted disabled:text-accent disabled:opacity-50"
            title="Plus comme ca"
          >
            {positiveSignalSent ? (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M7 10v12" />
                <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
              </svg>
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
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="m15 9-6 6" />
              <path d="m9 9 6 6" />
            </svg>
          </button>
        </div>
      </div>
    </Link>
  )
}
