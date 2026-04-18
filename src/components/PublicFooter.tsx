import Link from 'next/link'
import { BrandGlyph } from '@/components/BrandGlyph'

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
    <footer className="relative border-t border-border mt-16 py-6">
      <span
        aria-hidden
        className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-accent inline-flex"
      >
        <BrandGlyph size={14} />
      </span>
      <div className="max-w-2xl lg:max-w-5xl xl:max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          © {year} Distil
        </p>
        <nav aria-label="Public" className="flex items-center gap-4">
          <Link
            href="/about"
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:text-accent transition-colors"
          >
            {t.about}
          </Link>
        </nav>
      </div>
    </footer>
  )
}
