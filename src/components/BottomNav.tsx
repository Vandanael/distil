'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NAV_ITEMS } from '@/lib/nav'
import { useLocale } from '@/lib/i18n/context'

const NAV_KEYS: Record<string, keyof ReturnType<typeof useLocale>['t']['nav']> = {
  '/feed': 'feed',
  '/archive': 'archive',
  '/search': 'search',
  '/profile': 'profile',
}

const ICONS: Record<string, (active: boolean) => React.ReactNode> = {
  '/feed': (active) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true" strokeWidth={active ? 2.5 : 2} strokeLinecap="square">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  '/archive': (active) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true" strokeWidth={active ? 2.5 : 2} strokeLinecap="square">
      <rect width="20" height="5" x="2" y="3" />
      <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
      <path d="M10 12h4" />
    </svg>
  ),
  '/search': (active) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true" strokeWidth={active ? 2.5 : 2} strokeLinecap="square">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  '/profile': (active) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true" strokeWidth={active ? 2.5 : 2} strokeLinecap="square">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
}

export function BottomNav() {
  const pathname = usePathname()
  const { t } = useLocale()

  // Masque sur les pages article (lecture immersive)
  if (pathname.startsWith('/article/')) return null

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background md:hidden"
      aria-label="Navigation principale"
    >
      <div className="flex items-stretch h-14">
        {NAV_ITEMS.map(({ href }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          const icon = ICONS[href]
          const labelKey = NAV_KEYS[href]
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center justify-center gap-1 text-xs transition-colors ${
                active ? 'text-foreground bg-muted' : 'text-muted-foreground hover:text-foreground'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              {icon?.(active)}
              {labelKey ? t.nav[labelKey] : href}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
