'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { href: '/feed', label: 'Feed' },
  { href: '/archive', label: 'Archives' },
  { href: '/search', label: 'Recherche' },
  { href: '/profile', label: 'Profil' },
]

export function AppHeader() {
  const pathname = usePathname()
  const isArticle = pathname.startsWith('/article/')

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
          className="font-ui text-xl font-bold tracking-tight text-accent"
        >
          Distil
        </Link>

        <nav className="hidden md:flex items-center gap-6" aria-label="Navigation principale">
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname === href || (href !== '/feed' && pathname.startsWith(href + '/'))
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
                {label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
