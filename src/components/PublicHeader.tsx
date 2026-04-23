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

const WEEKDAYS = {
  fr: ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
} as const

const MONTHS = {
  fr: [
    'janvier',
    'février',
    'mars',
    'avril',
    'mai',
    'juin',
    'juillet',
    'août',
    'septembre',
    'octobre',
    'novembre',
    'décembre',
  ],
  en: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],
} as const

// Formateur manuel : on évite toLocaleDateString qui diverge entre ICU Node et ICU navigateur (hydration mismatch).
function formatToday(date: Date, locale: 'fr' | 'en'): string {
  const weekday = WEEKDAYS[locale][date.getDay()]
  const day = date.getDate()
  const month = MONTHS[locale][date.getMonth()]
  const year = date.getFullYear()
  return `${weekday} ${day} ${month} ${year}`
}

export function PublicHeader({ contextLabel }: Props) {
  const { locale, setLocale } = useLocale()
  const pathname = usePathname()
  const onLogin = pathname === '/login'

  const today = formatToday(new Date(), locale)

  const t = LABELS[locale]

  return (
    <header className="border-b border-border">
      <div className="max-w-2xl lg:max-w-5xl xl:max-w-6xl mx-auto px-5 md:px-8 py-3">
        <div className="flex items-center justify-between gap-4 h-8">
          <div className="flex items-center gap-3 md:gap-5 min-w-0 h-full">
            <Link href="/" className="hover:text-foreground transition-colors">
              <span className="inline-block translate-y-[2px] font-display text-2xl md:text-3xl leading-none italic text-accent">
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
              <span className="hidden sm:inline font-ui text-[15px] text-muted-foreground leading-none">
                {contextLabel}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0 h-full">
            <Link
              href={onLogin ? '/' : '/login'}
              className="inline-flex items-center h-full font-ui text-[15px] px-2 text-subtle hover:text-accent hover:underline hover:decoration-accent hover:decoration-2 focus-visible:underline focus-visible:decoration-accent focus-visible:decoration-2 transition-colors"
            >
              {onLogin ? t.home : t.login}
            </Link>
            <span className="text-border text-[15px] leading-none" aria-hidden="true">
              |
            </span>
            <button
              onClick={() => setLocale(locale === 'fr' ? 'en' : 'fr')}
              aria-label={locale === 'fr' ? 'FR · Switch to English' : 'EN · Passer en français'}
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
