'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NAV_ITEMS } from '@/lib/nav'
import { ThemeToggle } from '@/components/ThemeToggle'
import { LanguageToggle } from '@/components/LanguageToggle'
import { useLocale } from '@/lib/i18n/context'

const NAV_KEYS: Record<string, keyof ReturnType<typeof useLocale>['t']['nav']> = {
  '/feed': 'feed',
  '/library': 'library',
  '/search': 'search',
  '/profile': 'profile',
}

export function MainHeader() {
  const pathname = usePathname()
  const { locale, t } = useLocale()
  const isArticle = pathname.startsWith('/article/')

  const today = new Date().toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <header
      className={[
        'sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border',
        isArticle ? 'hidden md:block' : '',
      ]
        .join(' ')
        .trim()}
    >
      <div className="max-w-[720px] lg:max-w-[1160px] mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4 min-h-10">
          <div className="flex items-center gap-3 md:gap-5 min-w-0">
            <Link href="/feed" className="hover:opacity-80 transition-opacity">
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
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <nav className="hidden md:flex items-center gap-3" aria-label="Navigation principale">
              {NAV_ITEMS.map(({ href }) => {
                const active =
                  pathname === href || (href !== '/feed' && pathname.startsWith(href + '/'))
                const labelKey = NAV_KEYS[href]
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    className={`font-ui text-[15px] px-2 transition-colors ${
                      active ? 'text-foreground font-medium' : 'text-subtle hover:text-accent'
                    }`}
                  >
                    {labelKey ? t.nav[labelKey] : href}
                  </Link>
                )
              })}
            </nav>
            <span
              className="hidden md:inline text-border text-[15px] leading-none mx-1"
              aria-hidden="true"
            >
              |
            </span>
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  )
}
