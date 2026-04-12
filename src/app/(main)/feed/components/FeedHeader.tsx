'use client'

import Link from 'next/link'
import { useLocale } from '@/lib/i18n/context'

type Props = {
  today: string
  lastRefreshAt: string | null
  topInterests: string[]
}

export function FeedHeader({ today, lastRefreshAt, topInterests }: Props) {
  const { locale, t } = useLocale()

  const formattedDate = new Date(today).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const formattedTime = lastRefreshAt
    ? new Date(lastRefreshAt).toLocaleTimeString(locale === 'fr' ? 'fr-FR' : 'en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  return (
    <div className="border-t-2 border-foreground mb-8 pt-3 space-y-1">
      <div className="flex items-center justify-between">
        <span className="font-ui text-xs text-muted-foreground capitalize">{formattedDate}</span>
        {formattedTime && (
          <span className="font-ui text-xs text-muted-foreground">{formattedTime}</span>
        )}
      </div>
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="font-ui text-[13px] text-foreground">
          {t.feed.title}
          {topInterests.length > 0 && (
            <span className="text-muted-foreground"> — {topInterests.join(', ')}</span>
          )}
        </h1>
        <Link
          href="/profile"
          className="font-ui text-xs text-muted-foreground/70 hover:text-accent transition-colors shrink-0"
        >
          {t.feed.configure}
        </Link>
      </div>
    </div>
  )
}
