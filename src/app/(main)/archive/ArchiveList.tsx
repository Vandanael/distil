'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useLocale } from '@/lib/i18n/context'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { removeFromToRead } from '@/app/(main)/article/[id]/actions'

type Article = {
  id: string
  title: string | null
  site_name: string | null
  url: string
  reading_time_minutes: number | null
  archived_at: string | null
  score: number | null
}

type PendingRemoval = {
  timer: ReturnType<typeof setTimeout>
  cancelled: boolean
}

function formatAddedDate(iso: string | null, locale: 'fr' | 'en'): string {
  if (!iso) return ''
  const date = new Date(iso)
  const diffD = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
  const isFr = locale === 'fr'
  if (diffD === 0) return isFr ? "Ajouté aujourd'hui" : 'Added today'
  if (diffD === 1) return isFr ? 'Ajouté hier' : 'Added yesterday'
  if (diffD < 7) return isFr ? `Ajouté il y a ${diffD} jours` : `Added ${diffD}d ago`
  const weeks = Math.floor(diffD / 7)
  if (weeks === 1) return isFr ? 'Ajouté il y a 1 sem.' : 'Added 1w ago'
  if (diffD < 30) return isFr ? `Ajouté il y a ${weeks} sem.` : `Added ${weeks}w ago`
  const months = Math.floor(diffD / 30)
  return isFr ? `Ajouté il y a ${months} mois` : `Added ${months}mo ago`
}

type Props = { articles: Article[] }

export function ArchiveList({ articles }: Props) {
  const { locale, t } = useLocale()
  const [removedIds, setRemovedIds] = useState<Set<string>>(() => new Set())
  // Timers et flags d'annulation par article : on referme proprement si le
  // composant unmount ou si l'utilisateur clique Annuler avant les 4s.
  const pendingRef = useRef<Map<string, PendingRemoval>>(new Map())

  useEffect(() => {
    const pending = pendingRef.current
    return () => {
      for (const p of pending.values()) clearTimeout(p.timer)
      pending.clear()
    }
  }, [])

  function handleRemove(id: string) {
    setRemovedIds((prev) => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      return next
    })

    const existing = pendingRef.current.get(id)
    if (existing) clearTimeout(existing.timer)

    const entry: PendingRemoval = {
      cancelled: false,
      timer: setTimeout(() => {
        const current = pendingRef.current.get(id)
        pendingRef.current.delete(id)
        if (current?.cancelled) return
        void removeFromToRead(id)
      }, 4000),
    }
    pendingRef.current.set(id, entry)

    toast.success(t.library.removeToast, {
      action: {
        label: locale === 'fr' ? 'Annuler' : 'Undo',
        onClick: () => {
          const pending = pendingRef.current.get(id)
          if (pending) {
            pending.cancelled = true
            clearTimeout(pending.timer)
            pendingRef.current.delete(id)
          }
          setRemovedIds((prev) => {
            if (!prev.has(id)) return prev
            const next = new Set(prev)
            next.delete(id)
            return next
          })
        },
      },
      duration: 4000,
    })
  }

  const visibleArticles = articles.filter((a) => !removedIds.has(a.id))

  if (visibleArticles.length === 0) {
    return (
      <div className="space-y-3 py-8">
        <p className="font-ui text-sm text-muted-foreground">{t.library.empty}</p>
        <p className="font-body text-sm text-muted-foreground">{t.library.emptyDetail}</p>
        <Link href="/feed" className="font-ui text-sm text-accent hover:underline">
          {t.library.emptyBack}
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {visibleArticles.length >= 10 && (
        <div className="flex items-center justify-between gap-3 px-3 py-2 bg-muted rounded-sm">
          <p className="font-ui text-sm text-muted-foreground">
            {t.library.pileWarning.replace('{count}', String(visibleArticles.length))}
          </p>
        </div>
      )}
      <div
        className="space-y-3 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-x-10 lg:gap-y-0"
        data-testid="archive-list"
      >
        {visibleArticles.map((a) => (
          <div
            key={a.id}
            className="group relative border-b border-border pb-6 lg:py-6 lg:mb-0 last:border-0"
            data-testid={`archive-card-${a.id}`}
          >
            <Link
              href={`/article/${a.id}?from=library`}
              className="block space-y-2 pr-12"
              data-testid={`archive-card-link-${a.id}`}
            >
              <h2 className="font-ui text-base font-semibold text-foreground leading-snug group-hover:text-accent transition-colors">
                {a.title ?? 'Sans titre'}
              </h2>
              <div className="flex items-center gap-3">
                {a.site_name && (
                  <span className="font-ui text-sm text-muted-foreground">{a.site_name}</span>
                )}
                {a.reading_time_minutes && (
                  <span className="font-ui text-sm text-muted-foreground">
                    {a.reading_time_minutes} min
                  </span>
                )}
                {a.archived_at && (
                  <span className="font-ui text-sm text-muted-foreground/60 ml-auto">
                    {formatAddedDate(a.archived_at, locale)}
                  </span>
                )}
              </div>
            </Link>

            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={(e: React.MouseEvent) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleRemove(a.id)
                    }}
                    aria-label={
                      locale === 'fr'
                        ? `Retirer ${a.title ?? 'cet article'} de À lire`
                        : `Remove ${a.title ?? 'this article'} from To read`
                    }
                    data-testid={`archive-remove-${a.id}`}
                    className="absolute top-0 right-0 inline-flex items-center justify-center h-11 w-11 text-muted-foreground/60 hover:text-destructive transition-colors"
                  />
                }
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
                  <path d="M3 6h18" />
                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6" />
                  <path d="M14 11v6" />
                </svg>
              </TooltipTrigger>
              <TooltipContent side="top" className="hidden md:block">
                <p className="font-ui text-sm">{t.library.removeTooltip}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        ))}
      </div>
    </div>
  )
}
