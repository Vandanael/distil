'use client'

import { useLocale } from '@/lib/i18n/context'

export function EmptyEssential() {
  const { t } = useLocale()

  return (
    <div className="py-6 lg:col-span-2" data-testid="empty-essential">
      <p className="font-ui text-sm font-medium text-muted-foreground">
        {t.feed.emptyEssentialTitle}
      </p>
      <p className="font-body text-sm text-subtle mt-1">{t.feed.emptyEssentialDetail}</p>
    </div>
  )
}
