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

export function AppHeader() {
  const pathname = usePathname()
  const isArticle = pathname.startsWith('/article/')
  const { t } = useLocale()

  return (
    <header
      className={[
        'sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-sm',
        isArticle ? 'hidden md:block' : '',
      ]
        .join(' ')
        .trim()}
    >
      <div className="max-w-2xl mx-auto px-4 h-12 flex items-center justify-between">
        <Link
          href="/feed"
          className="font-display italic text-2xl leading-none text-accent hover:opacity-80 transition-opacity"
        >
          Distil
        </Link>

        <nav className="hidden md:flex items-center gap-6" aria-label="Navigation principale">
          {NAV_ITEMS.map(({ href }) => {
            const active =
              pathname === href || (href !== '/feed' && pathname.startsWith(href + '/'))
            const labelKey = NAV_KEYS[href]
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`font-ui text-sm transition-colors ${
                  active
                    ? 'text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {labelKey ? t.nav[labelKey] : href}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-1">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
