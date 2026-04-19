'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale } from '@/lib/i18n/context'
import { ThemeToggle } from './ThemeToggle'

type Props = {
  // Label contextuel affiché à droite de la date (ex: "À propos", "Exemple · Politique").
  contextLabel?: string
}

const LABELS = {
  fr: { login: 'Connexion', home: 'Accueil' },
  en: { login: 'Sign in', home: 'Home' },
} as const

export function PublicHeader({ contextLabel }: Props) {
  const { locale, setLocale } = useLocale()
  const pathname = usePathname()
  const onLogin = pathname === '/login'

  const today = new Date().toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const t = LABELS[locale]

  return (
    <header className="border-t-2 border-foreground">
      <div className="max-w-2xl lg:max-w-5xl xl:max-w-6xl mx-auto px-5 md:px-8 pt-3">
        <div className="flex items-center justify-between gap-4 h-8">
          <div className="flex items-center gap-3 md:gap-5 min-w-0 h-full">
            <Link href="/" className="hover:text-foreground transition-colors">
              <span className="font-display text-2xl md:text-3xl leading-none italic text-accent">
                Distil
              </span>
            </Link>
            <span
              className="hidden sm:inline text-border text-[15px] leading-none"
              aria-hidden="true"
            >
              |
            </span>
            <span className="hidden sm:inline font-ui text-[15px] text-subtle truncate leading-none capitalize">
              {today}
            </span>
            {contextLabel && (
              <span className="hidden sm:inline font-ui text-[15px] text-subtle/60 leading-none">
                {contextLabel}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0 h-full">
            <Link
              href={onLogin ? '/' : '/login'}
              className="inline-flex items-center h-full font-ui text-[15px] px-2 text-subtle hover:text-accent transition-colors"
            >
              {onLogin ? t.home : t.login}
            </Link>
            <span className="text-border text-[15px] leading-none" aria-hidden="true">
              |
            </span>
            <button
              onClick={() => setLocale(locale === 'fr' ? 'en' : 'fr')}
              aria-label={locale === 'fr' ? 'Switch to English' : 'Passer en français'}
              className="inline-flex items-center h-full font-ui text-[15px] px-2 text-subtle hover:text-foreground transition-colors"
            >
              {locale.toUpperCase()}
            </button>
            <span className="text-border text-[15px] leading-none" aria-hidden="true">
              |
            </span>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  )
}
