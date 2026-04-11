'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  {
    href: '/feed',
    label: 'Feed',
    icon: (active: boolean) => (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={active ? 2.5 : 2}
        strokeLinecap="square"
      >
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    href: '/search',
    label: 'Recherche',
    icon: (active: boolean) => (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={active ? 2.5 : 2}
        strokeLinecap="square"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    href: '/profile',
    label: 'Profil',
    icon: (active: boolean) => (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={active ? 2.5 : 2}
        strokeLinecap="square"
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
]

export function BottomNav() {
  const pathname = usePathname()

  // Masque sur les pages article (lecture immersive)
  if (pathname.startsWith('/article/')) return null

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background md:hidden"
      aria-label="Navigation principale"
    >
      <div className="flex items-stretch h-14">
        {TABS.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center justify-center gap-1 text-[10px] uppercase tracking-widest transition-colors ${
                active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              {icon(active)}
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
