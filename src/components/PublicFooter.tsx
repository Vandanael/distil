import Link from 'next/link'

type Lang = 'fr' | 'en'

const COPY = {
  fr: {
    about: 'A propos',
  },
  en: {
    about: 'About',
  },
} as const

export function PublicFooter({ lang = 'fr' }: { lang?: Lang }) {
  const t = COPY[lang]
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border mt-16 py-6">
      <div className="max-w-2xl lg:max-w-5xl xl:max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <p className="font-ui text-[15px] text-subtle">
          © {year} <span className="text-accent">Distil</span>
        </p>
        <nav aria-label="Public" className="flex items-center gap-4">
          <Link
            href="/about"
            className="font-ui text-[15px] text-subtle hover:text-accent transition-colors"
          >
            {t.about}
          </Link>
        </nav>
      </div>
    </footer>
  )
}
