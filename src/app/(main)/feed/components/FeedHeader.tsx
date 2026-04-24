'use client'

import { useState, useSyncExternalStore, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useLocale } from '@/lib/i18n/context'
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus'
import { Spinner } from '@/components/ui/spinner'

type Props = {
  lastRefreshAt: string | null
  topInterests: string[]
  hasLightHarvest?: boolean
  daysSinceLastLogin?: number
}

export function FeedHeader({
  lastRefreshAt,
  topInterests,
  hasLightHarvest,
  daysSinceLastLogin,
}: Props) {
  const { locale, t } = useLocale()
  const router = useRouter()
  const [isRefreshing, startRefreshTransition] = useTransition()
  const isOnline = useOnlineStatus()

  const absenceBannerKey = `distil_absence_banner_dismissed_${new Date().toISOString().slice(0, 10)}`
  const absenceBannerDismissed = useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === 'undefined') return () => {}
      const handler = (e: StorageEvent) => {
        if (e.key === absenceBannerKey) onStoreChange()
      }
      window.addEventListener('storage', handler)
      return () => window.removeEventListener('storage', handler)
    },
    () => typeof window !== 'undefined' && !!window.localStorage.getItem(absenceBannerKey),
    () => false
  )

  function dismissAbsenceBanner() {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(absenceBannerKey, 'true')
      window.dispatchEvent(new StorageEvent('storage', { key: absenceBannerKey }))
    }
  }

  const showAbsenceBanner = (daysSinceLastLogin ?? 0) > 3 && !absenceBannerDismissed

  const [nowMs] = useState(() => Date.now())
  function formatRefreshAge(isoDate: string): { label: string; isStale: boolean } {
    const diffMs = nowMs - new Date(isoDate).getTime()
    const diffH = Math.floor(diffMs / (1000 * 60 * 60))
    const isFr = locale === 'fr'
    if (diffH < 1) return { label: isFr ? "a l'instant" : 'just now', isStale: false }
    if (diffH < 24)
      return { label: isFr ? `il y a ${diffH}h` : `${diffH}h ago`, isStale: diffH > 12 }
    const diffD = Math.floor(diffH / 24)
    return { label: isFr ? `il y a ${diffD}j` : `${diffD}d ago`, isStale: true }
  }

  const refreshInfo = lastRefreshAt ? formatRefreshAge(lastRefreshAt) : null

  function handleRefresh() {
    startRefreshTransition(() => {
      router.refresh()
    })
  }

  return (
    <header className="mb-6 mt-2">
      {!isOnline && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-muted rounded-sm font-ui text-sm text-muted-foreground">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="2" y1="2" x2="22" y2="22" />
            <path d="M8.5 16.5a5 5 0 0 1 7 0" />
            <path d="M2 8.82a15 15 0 0 1 4.17-2.65" />
            <path d="M10.66 5c4.01-.36 8.14.9 11.34 3.76" />
            <path d="M16.85 11.25a10 10 0 0 1 2.22 1.68" />
            <path d="M5 12.03a10 10 0 0 1 5.24-2.63" />
            <circle cx="12" cy="20" r="1" />
          </svg>
          {locale === 'fr' ? 'Hors ligne - le feed peut ne pas etre a jour.' : 'Offline - the feed might not be up to date.'}
        </div>
      )}
      {showAbsenceBanner && (
        <div
          data-testid="absence-banner"
          className="flex items-start justify-between gap-3 mb-3 px-3 py-2 bg-muted rounded-sm"
        >
          <p className="font-ui text-sm text-muted-foreground">{t.feed.absenceBanner}</p>
          <button
            type="button"
            onClick={dismissAbsenceBanner}
            aria-label={locale === 'fr' ? 'Fermer' : 'Dismiss'}
            className="shrink-0 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
      )}
      {hasLightHarvest && (
        <p className="mb-3 text-sm text-muted-foreground font-ui">{t.feed.lightHarvest}</p>
      )}
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <h1 className="font-ui text-base md:text-lg font-semibold text-foreground">
          {t.feed.title}
          {topInterests.length > 0 && (
            <span className="font-normal text-subtle"> - {topInterests.join(', ')}</span>
          )}
        </h1>
        <div className="flex items-center gap-2 shrink-0 ml-auto font-ui text-sm text-subtle">
          {refreshInfo && (
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing || !isOnline}
              className="inline-flex items-center gap-1.5 text-subtle/60 hover:text-accent transition-colors disabled:opacity-40"
            >
              {isRefreshing && <Spinner className="size-3.5" />}
              {locale === 'fr' ? 'récupéré' : 'fetched'} {refreshInfo.label}
            </button>
          )}
          <span className="text-border leading-none" aria-hidden="true">
            |
          </span>
          <Link href="/profile" className="px-1 text-subtle hover:text-accent transition-colors">
            {t.feed.configure}
          </Link>
        </div>
      </div>
    </header>
  )
}
