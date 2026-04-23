'use client'

import Link from 'next/link'
import { useLocale } from '@/lib/i18n/context'

type Lang = 'fr' | 'en'

const COPY = {
  fr: {
    home: 'Accueil',
    about: 'À propos',
    privacy: 'Confidentialité',
    terms: 'Conditions',
    rights: 'Tous droits réservés.',
    navLabel: 'Navigation publique',
  },
  en: {
    home: 'Home',
    about: 'About',
    privacy: 'Privacy',
    terms: 'Terms',
    rights: 'All rights reserved.',
    navLabel: 'Public navigation',
  },
} as const

export function PublicFooter({ lang }: { lang?: Lang } = {}) {
  const { locale } = useLocale()
  const effective: Lang = lang ?? locale
  const t = COPY[effective]
  const year = new Date().getFullYear()

  return (
    <footer className="bg-footer border-t border-border">
      <div className="max-w-2xl lg:max-w-5xl xl:max-w-6xl mx-auto px-5 md:px-8 py-5 md:py-6">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <nav aria-label={t.navLabel}>
            <ul className="flex flex-wrap items-center gap-x-5 gap-y-1 font-ui text-[15px] text-subtle">
              <li>
                <Link href="/" className="hover:text-accent transition-colors">
                  {t.home}
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-accent transition-colors">
                  {t.about}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-accent transition-colors">
                  {t.privacy}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-accent transition-colors">
                  {t.terms}
                </Link>
              </li>
            </ul>
          </nav>
          <p className="font-ui text-[15px] text-subtle">
            © {year} <span className="text-accent">Distil</span>. {t.rights}
          </p>
        </div>
      </div>
    </footer>
  )
}
