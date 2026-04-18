import Link from 'next/link'

type Lang = 'fr' | 'en'

const COPY = {
  fr: {
    about: 'A propos',
    login: 'Connexion',
  },
  en: {
    about: 'About',
    login: 'Sign in',
  },
} as const

export function PublicFooter({ lang = 'fr' }: { lang?: Lang }) {
  const t = COPY[lang]
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border mt-16 py-6">
      <div className="max-w-2xl lg:max-w-5xl xl:max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <p className="font-ui text-xs text-muted-foreground">© {year} Distil</p>
        <nav aria-label="Public" className="flex items-center gap-4">
          <Link
            href="/about"
            className="font-ui text-xs text-muted-foreground hover:text-accent transition-colors"
          >
            {t.about}
          </Link>
          <Link
            href="/login"
            className="font-ui text-xs text-muted-foreground hover:text-accent transition-colors"
          >
            {t.login}
          </Link>
        </nav>
      </div>
    </footer>
  )
}
