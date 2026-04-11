'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from './ThemeToggle'

/**
 * Header principal de l'app.
 * Se masque sur mobile lors de la lecture d'un article (experience immersive).
 */
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
      <div className="max-w-3xl mx-auto px-4 h-12 flex items-center justify-between">
        <Link
          href="/feed"
          className="font-logo text-xl tracking-tight text-foreground hover:text-accent transition-colors"
        >
          DISTIL
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <Link href="/feed" className="hover:text-foreground transition-colors">
            Feed
          </Link>
          <Link href="/search" className="hover:text-foreground transition-colors">
            Recherche
          </Link>
          <Link href="/archive" className="hover:text-foreground transition-colors">
            Archives
          </Link>
          <Link href="/highlights" className="hover:text-foreground transition-colors">
            Highlights
          </Link>
          <Link href="/profile" className="hover:text-foreground transition-colors">
            Profil
          </Link>
        </nav>

        <ThemeToggle />
      </div>
    </header>
  )
}
