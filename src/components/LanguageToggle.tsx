// Masque en PR 15, conserve pour reactivation post-i18n complete. Voir BACKLOG.md.

'use client'

import { useLocale } from '@/lib/i18n/context'

export function LanguageToggle() {
  const { locale, setLocale } = useLocale()

  return (
    <button
      type="button"
      onClick={() => setLocale(locale === 'fr' ? 'en' : 'fr')}
      aria-label={locale === 'fr' ? 'EN · Switch to English' : 'FR · Passer en français'}
      className="font-ui text-sm font-medium tracking-wide text-muted-foreground hover:text-foreground transition-colors px-1.5 py-0.5 border border-transparent hover:border-border"
      data-testid="language-toggle"
    >
      {locale === 'fr' ? 'EN' : 'FR'}
    </button>
  )
}
