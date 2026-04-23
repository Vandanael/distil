'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRef, useState, useTransition, useEffect } from 'react'
import { toast } from 'sonner'
import { addToRead, markNotInterested } from '@/app/(main)/article/[id]/actions'
import { useSwipeActions } from '@/lib/hooks/useSwipeActions'
import { useLocale } from '@/lib/i18n/context'
import { isReferenceDomain } from '@/lib/agents/sources'
import { scoreToTag, type RelevanceTag } from '@/lib/scoring/tag'
import { scoreColorClass } from '@/lib/utils'
import { useDismissContext } from './DismissContext'

const SIGNAL_COACH_FLAG = 'distil_signal_coach_seen'

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
  bucket?: 'essential' | 'surprise' | null
  sourceKind?: 'rss' | 'agent' | null
  publishedAt: string | null
  scoredAt: string | null
  wordCount: number | null
  ogImageUrl: string | null
  isRead?: boolean
  staggerIndex?: number
  subScores?: { q1: number | null; q2: number | null; q3: number | null } | null
  carryOverCount?: number
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

function formatCarryOverBadge(scoredAt: string | null, locale: 'fr' | 'en'): string {
  if (!scoredAt) return locale === 'fr' ? 'Hier' : 'Yesterday'
  const date = new Date(scoredAt)
  if (isNaN(date.getTime())) return locale === 'fr' ? 'Hier' : 'Yesterday'
  const diffMs = Date.now() - date.getTime()
  const diffD = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const isFr = locale === 'fr'
  if (diffD <= 1) return isFr ? 'Hier' : 'Yesterday'
  return isFr
    ? `De ${date.toLocaleDateString('fr-FR', { weekday: 'long' })}`
    : `From ${date.toLocaleDateString('en-GB', { weekday: 'long' })}`
}

function formatPublishedDate(dateStr: string | null, locale: 'fr' | 'en'): string | null {
  if (!dateStr) return null
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return null
  const isFr = locale === 'fr'
  const diffMs = Date.now() - date.getTime()
  const diffH = Math.floor(diffMs / (1000 * 60 * 60))
  if (diffH < 24) return isFr ? "aujourd'hui" : 'today'
  if (diffH < 48) return isFr ? 'hier' : 'yesterday'
  // Absolu : "17 avril" si meme annee, sinon "17 avril 2024"
  const now = new Date()
  const sameYear = date.getFullYear() === now.getFullYear()
  return date.toLocaleDateString(isFr ? 'fr-FR' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
  })
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
  bucket = null,
  sourceKind = null,
  publishedAt,
  scoredAt,
  wordCount,
  ogImageUrl,
  isRead = false,
  staggerIndex = 0,
  subScores = null,
  carryOverCount = 0,
}: Props) {
  const { locale, t } = useLocale()
  const { dismissedIds } = useDismissContext()
  const [dismissed, setDismissed] = useState(false)
  const [positiveSignalSent, setPositiveSignalSent] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [isDismissing, startDismissTransition] = useTransition()
  const undoRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cancelledRef = useRef(false)
  const carryOverLabel = carryOverCount >= 1 ? formatCarryOverBadge(scoredAt, locale) : null
  const retrievedRelative = formatRelativeDate(scoredAt, locale)
  const publishedLabel = formatPublishedDate(publishedAt, locale)
  const retrievedLabel = retrievedRelative
    ? locale === 'fr'
      ? `récupéré ${retrievedRelative}`
      : `fetched ${retrievedRelative}`
    : null
  const isPaywall = wordCount === 0
  const tag: RelevanceTag | null = scoreToTag(score, bucket, isSerendipity, origin)
  const hasSubScores =
    subScores && (subScores.q1 !== null || subScores.q2 !== null || subScores.q3 !== null)
  // Les 3 premieres cartes sont potentiellement above-the-fold
  const isAboveFold = staggerIndex < 3

  useEffect(() => {
    return () => {
      if (undoRef.current) clearTimeout(undoRef.current)
    }
  }, [])

  const {
    handlers: swipeHandlers,
    style: swipeStyle,
    direction: swipeDirection,
    progress: swipeProgress,
  } = useSwipeActions({
    onSwipeLeft: () => handleNotInterested(),
    onSwipeRight: () => handleAddToRead(),
    enabled: !dismissed,
  })

  if (dismissed || dismissedIds.has(id)) return null

  function handleNotInterested() {
    const reason = isRead ? 'already_read' : 'off_topic'
    setDismissed(true)
    cancelledRef.current = false
    if (undoRef.current) clearTimeout(undoRef.current)

    toast.success(t.article.notInterestedToast, {
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
          await markNotInterested(id, reason)
        })
      }
    }, 4000)
  }

  function handleAddToRead() {
    setDismissed(true)
    cancelledRef.current = false
    if (undoRef.current) clearTimeout(undoRef.current)

    toast.success(t.article.addedToRead, {
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
          await addToRead(id)
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
      const coachSeen =
        typeof window !== 'undefined' && window.localStorage.getItem(SIGNAL_COACH_FLAG)
      if (coachSeen) {
        toast.success(t.article.positiveSent)
      } else {
        toast.success(t.article.positiveSentCoach, { duration: 6000 })
        if (typeof window !== 'undefined') window.localStorage.setItem(SIGNAL_COACH_FLAG, '1')
      }
    } catch {
      setPositiveSignalSent(false)
      toast.error(locale === 'fr' ? "Erreur lors de l'envoi du signal." : 'Error sending signal.')
    }
  }

  return (
    <div className="relative -mx-3" data-article-card-wrapper>
      {swipeDirection === 'right' && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-start pl-6 bg-primary text-primary-foreground"
          style={{ opacity: Math.max(0.4, swipeProgress) }}
          data-testid={`swipe-archive-indicator-${id}`}
        >
          <span className="flex items-center gap-2 font-ui text-sm font-semibold">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect width="20" height="5" x="2" y="3" rx="1" />
              <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
              <path d="M10 12h4" />
            </svg>
            {t.article.addToReadShort}
          </span>
        </div>
      )}
      {swipeDirection === 'left' && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-end pr-6 bg-destructive text-white"
          style={{ opacity: Math.max(0.4, swipeProgress) }}
          data-testid={`swipe-dismiss-indicator-${id}`}
        >
          <span className="flex items-center gap-2 font-ui text-sm font-semibold">
            {t.article.notInterestedShort}
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 6h18" />
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <path d="M19 6 17.5 20a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2L5 6" />
            </svg>
          </span>
        </div>
      )}
      <div
        className="group relative block py-5 md:py-6 px-3 bg-background transition-colors hover:bg-muted/40 focus-within:ring-2 focus-within:ring-accent/50 focus-within:rounded-sm"
        data-testid={`article-card-${id}`}
        data-article-card
        data-article-id={id}
        style={{ '--stagger': staggerIndex, ...swipeStyle } as React.CSSProperties}
        {...swipeHandlers}
      >
        {/* Lien plein-carte (pattern stretched link) : clic n'importe ou sauf boutons actions (z-10) */}
        <Link
          href={`/article/${id}?from=feed`}
          className="absolute inset-0 z-0 rounded-sm focus:outline-none"
          aria-label={title ?? 'Sans titre'}
          data-testid={`article-card-link-${id}`}
        />

        {/* Ligne meta : source · date · duree */}
        <div className="pointer-events-none relative flex flex-wrap items-center gap-1.5 mb-2 text-sm text-muted-foreground">
          {origin === 'bookmarklet' && (
            <span
              className="text-accent shrink-0"
              data-testid={`origin-badge-${id}`}
              title="Ajouté par vous"
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
          {siteName && (
            <span className="font-ui whitespace-nowrap">
              {siteName}
              {isReferenceDomain(siteName) && (
                <span className="ml-1 text-sm text-accent/70" title="Source de reference">
                  Ref.
                </span>
              )}
            </span>
          )}
          {publishedLabel && (
            <span className="whitespace-nowrap font-ui">
              {siteName && '· '}
              {publishedLabel}
            </span>
          )}
          {retrievedLabel && (
            <span className="whitespace-nowrap font-ui text-muted-foreground/70">
              {(siteName || publishedLabel) && '· '}
              {retrievedLabel}
            </span>
          )}
          {readingTimeMinutes && (
            <span className="whitespace-nowrap font-ui">
              {(siteName || publishedLabel || retrievedLabel) && '· '}
              {readingTimeMinutes} min
            </span>
          )}
          {isPaywall && (
            <span
              className="whitespace-nowrap text-destructive/70"
              data-testid={`paywall-badge-${id}`}
              title="Contenu non accessible - article probablement derriere un paywall"
            >
              · Paywall
            </span>
          )}
          {carryOverLabel && (
            <span
              className="whitespace-nowrap font-ui text-muted-foreground/60"
              data-testid={`carry-over-badge-${id}`}
            >
              · {carryOverLabel}
            </span>
          )}
          {sourceKind === 'agent' && (
            <span
              className="whitespace-nowrap font-ui text-sm text-muted-foreground/70 opacity-0 group-hover:opacity-100 transition-opacity"
              data-testid={`discovery-badge-${id}`}
              title={t.article.originAgentTooltip}
            >
              · {t.article.originAgent}
            </span>
          )}
        </div>

        {/* Ligne 3-4 : titre + thumbnail */}
        <div className="pointer-events-none relative flex items-start gap-5">
          <div className="flex-1 min-w-0">
            <h2
              className={`font-ui text-[24px] md:text-[26px] font-bold leading-[1.2] group-hover:text-accent transition-colors duration-150${isPaywall ? ' line-through decoration-muted-foreground/40' : ''}${isRead ? ' text-muted-foreground' : ' text-foreground'}`}
            >
              {title ?? 'Sans titre'}
            </h2>
            {excerpt && !isPaywall && (
              <p className="font-body text-[16px] md:text-[17px] text-muted-foreground line-clamp-2 leading-[1.55] mt-2">
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

        {/* Bloc relevance : score toujours visible, justif + sous-scores derriere toggle "Pourquoi ?" */}
        {tag && (
          <div className="pointer-events-none relative mt-4 pt-3 border-t border-border/60 space-y-2">
            <div className="flex items-baseline gap-3">
              {score !== null && (
                <span
                  data-testid={`score-${id}`}
                  className={`font-ui text-lg tabular-nums ${scoreColorClass(score)}`}
                >
                  {Math.round(score)}
                  <span className="text-sm text-muted-foreground font-normal">%</span>
                </span>
              )}
              {tag && (
                <span className="font-ui text-xs uppercase tracking-wider text-muted-foreground">
                  {tag === 'relevant' ? t.article.tagRelevant : t.article.tagDiscovery}
                </span>
              )}
              <span data-testid={`tag-${id}`} className="sr-only">
                {Math.round(score ?? 0)}%
              </span>
              {(justification || hasSubScores) && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setShowDetails((v) => !v)
                  }}
                  aria-expanded={showDetails}
                  aria-controls={`relevance-details-${id}`}
                  data-testid={`toggle-details-${id}`}
                  className="pointer-events-auto relative z-10 font-ui text-sm text-muted-foreground hover:text-accent transition-colors inline-flex items-center gap-1"
                >
                  {t.article.tagDetails}
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    className={`transition-transform ${showDetails ? 'rotate-180' : ''}`}
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
              )}
            </div>
            {showDetails && (justification || hasSubScores) && (
              <div id={`relevance-details-${id}`} className="space-y-2">
                {justification && (
                  <p
                    data-testid={`justification-inline-${id}`}
                    className="font-body text-sm text-muted-foreground leading-relaxed"
                  >
                    {justification}
                  </p>
                )}
                {hasSubScores && (
                  <dl
                    data-testid={`sub-scores-${id}`}
                    className="flex flex-wrap gap-x-5 gap-y-1 font-ui text-sm text-muted-foreground"
                  >
                    <div className="flex items-baseline gap-1.5">
                      <dt>{t.article.subScoreQ1}</dt>
                      <dd className="font-semibold text-foreground tabular-nums">
                        {subScores!.q1 ?? '—'}
                        <span className="text-muted-foreground font-normal">/10</span>
                      </dd>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <dt>{t.article.subScoreQ2}</dt>
                      <dd className="font-semibold text-foreground tabular-nums">
                        {subScores!.q2 ?? '—'}
                        <span className="text-muted-foreground font-normal">/10</span>
                      </dd>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <dt>{t.article.subScoreQ3}</dt>
                      <dd className="font-semibold text-foreground tabular-nums">
                        {subScores!.q3 ?? '—'}
                        <span className="text-muted-foreground font-normal">/10</span>
                      </dd>
                    </div>
                  </dl>
                )}
              </div>
            )}
          </div>
        )}

        {/* Ligne actions : hors Link via z-10 pour que les clics prennent */}
        <div className="relative z-10 flex items-center gap-3 mt-3">
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={handlePositiveSignal}
              disabled={positiveSignalSent}
              aria-label={t.article.moreLikeThis}
              data-testid={`signal-${id}`}
              className="inline-flex items-center justify-center gap-2 h-11 w-11 md:w-auto md:px-3 font-ui text-sm text-muted-foreground/60 transition-colors hover:text-accent hover:bg-muted disabled:text-accent disabled:opacity-50"
              title={t.article.moreLikeThis}
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
              {!positiveSignalSent && (
                <span className="hidden md:inline whitespace-nowrap text-sm">
                  {t.article.moreLikeThis}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleNotInterested()
              }}
              disabled={isDismissing}
              aria-label={t.article.notInterested}
              data-testid={`dismiss-${id}`}
              className="inline-flex items-center justify-center gap-2 h-11 w-11 md:w-auto md:px-3 font-ui text-sm text-muted-foreground/60 transition-colors hover:text-destructive hover:bg-muted disabled:opacity-20"
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
              <span className="hidden md:inline whitespace-nowrap text-sm">
                {t.article.notInterestedShort}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
