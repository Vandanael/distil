'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { useLocale } from '@/lib/i18n/context'

type Props = {
  today: string
  lastRefreshAt: string | null
  topInterests: string[]
}

export function FeedHeader({ today, lastRefreshAt, topInterests }: Props) {
  const { locale, t } = useLocale()
  const router = useRouter()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const formattedDate = new Date(today).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  function formatRefreshAge(isoDate: string): { label: string; isStale: boolean } {
    const diffMs = Date.now() - new Date(isoDate).getTime()
    const diffH = Math.floor(diffMs / (1000 * 60 * 60))
    const isFr = locale === 'fr'
    if (diffH < 1) return { label: isFr ? "a l'instant" : 'just now', isStale: false }
    if (diffH < 24)
      return { label: isFr ? `il y a ${diffH}h` : `${diffH}h ago`, isStale: diffH > 12 }
    const diffD = Math.floor(diffH / 24)
    return { label: isFr ? `il y a ${diffD}j` : `${diffD}d ago`, isStale: true }
  }

  const refreshInfo = lastRefreshAt ? formatRefreshAge(lastRefreshAt) : null

  async function handleRefresh() {
    setIsRefreshing(true)
    const toastId = toast.loading('Recherche de nouveaux articles...')
    try {
      const res = await fetch('/api/feed/refresh', { method: 'POST' })
      if (res.status === 429) {
        toast.error('Attendez quelques minutes avant de relancer.', { id: toastId })
        return
      }
      if (!res.ok) {
        toast.error('Erreur lors du rafraichissement', { id: toastId })
        return
      }
      const data = (await res.json()) as { accepted?: number }
      const count = data.accepted ?? 0
      if (count > 0) {
        toast.success(`${count} nouvel article${count > 1 ? 's' : ''}`, { id: toastId })
        router.refresh()
      } else {
        toast.info('Aucun nouvel article', { id: toastId })
      }
    } catch {
      toast.error('Erreur lors du rafraichissement', { id: toastId })
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div className="border-t-2 border-foreground mb-10 pt-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-ui text-sm text-muted-foreground capitalize">{formattedDate}</span>
        <div className="flex items-center gap-2">
          {refreshInfo && (
            <span
              className={`font-ui text-sm ${refreshInfo.isStale ? 'text-muted-foreground/50' : 'text-muted-foreground'}`}
            >
              {refreshInfo.label}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="font-ui text-xs text-muted-foreground/70 hover:text-accent transition-colors disabled:opacity-50"
            title="Rafraichir le feed"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={isRefreshing ? 'animate-spin' : ''}
            >
              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
            </svg>
          </button>
        </div>
      </div>
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="font-ui text-base md:text-lg font-semibold text-foreground">
          {t.feed.title}
          {topInterests.length > 0 && (
            <span className="font-normal text-muted-foreground"> - {topInterests.join(', ')}</span>
          )}
        </h1>
        <Link
          href="/profile"
          className="font-ui text-sm text-muted-foreground/70 hover:text-accent transition-colors shrink-0"
        >
          {t.feed.configure}
        </Link>
      </div>
    </div>
  )
}
