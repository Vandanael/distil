'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from '@/lib/i18n/context'

type Phase = 'searching' | 'none' | 'error'

export function EmptyFeed() {
  const router = useRouter()
  const { t } = useLocale()
  const [phase, setPhase] = useState<Phase>('searching')

  useEffect(() => {
    let cancelled = false

    async function autoRefresh() {
      try {
        const res = await fetch('/api/feed/refresh', { method: 'POST' })
        if (cancelled) return
        if (!res.ok) {
          setPhase('error')
          return
        }
        const data = (await res.json()) as { accepted?: number }
        if (cancelled) return
        if ((data.accepted ?? 0) > 0) {
          router.refresh()
        } else {
          setPhase('none')
        }
      } catch {
        if (!cancelled) setPhase('error')
      }
    }

    void autoRefresh()
    return () => {
      cancelled = true
    }
  }, [router])

  if (phase === 'searching') {
    return (
      <div className="py-12 space-y-6">
        <div className="h-px w-full bg-border overflow-hidden">
          <div
            className="h-px bg-accent animate-[progress_2s_ease-in-out_infinite]"
            style={{ width: '40%' }}
          />
        </div>
        <div className="space-y-2">
          <p className="font-ui text-sm text-foreground font-medium">{t.feed.searching}</p>
          <p className="font-body text-sm text-muted-foreground leading-relaxed">
            {t.feed.searchingDetail}
          </p>
        </div>
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div className="space-y-4 py-12">
        <p className="font-ui text-sm text-foreground font-medium">{t.feed.errorTitle}</p>
        <p className="font-body text-sm text-muted-foreground">
          {t.feed.errorDetail}{' '}
          <Link href="/profile" className="text-accent underline underline-offset-[3px] decoration-accent/50 hover:decoration-accent">
            {t.feed.errorLink}
          </Link>
          .
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 py-12">
      <p className="font-ui text-sm text-foreground font-medium">{t.feed.noneTitle}</p>
      <p className="font-body text-sm text-muted-foreground leading-relaxed">
        {t.feed.noneDetail}{' '}
        <Link href="/profile" className="text-accent underline underline-offset-[3px] decoration-accent/50 hover:decoration-accent">
          {t.feed.noneLink}
        </Link>{' '}
        {t.feed.noneEnd}
      </p>
    </div>
  )
}
