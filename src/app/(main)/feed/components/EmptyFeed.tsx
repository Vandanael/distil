import Link from 'next/link'
import { translations } from '@/lib/i18n/translations'

const t = translations.fr.feed

export function EmptyFeed() {
  return (
    <div className="space-y-4 py-12">
      <p className="font-ui text-sm text-foreground font-medium">{t.noneTitle}</p>
      <p className="font-body text-sm text-muted-foreground leading-relaxed">
        {t.noneDetail}{' '}
        <Link
          href="/profile"
          className="text-accent underline underline-offset-[3px] decoration-accent/50 hover:decoration-accent"
        >
          {t.noneLink}
        </Link>{' '}
        {t.noneEnd}
      </p>
    </div>
  )
}
