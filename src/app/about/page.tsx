import Link from 'next/link'
import { ThemeToggle } from '@/components/ThemeToggle'
import { PublicFooter } from '@/components/PublicFooter'
import { BrandGlyph } from '@/components/BrandGlyph'

export const metadata = {
  title: 'A propos - Distil',
  description:
    'Distil est une veille intelligente et un read-later personnel. Curation IA transparente, diversite editoriale by design.',
}

export default function AboutPage() {
  const year = new Date().getFullYear()

  return (
    <main className="min-h-full flex flex-col bg-background">
      <div className="w-full max-w-2xl mx-auto flex-1 px-5 md:px-8 py-5 md:py-10">
        {/* Masthead editorial */}
        <header className="border-t-2 border-foreground pt-3 mb-12 md:mb-16">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-baseline gap-3 md:gap-5 min-w-0">
              <Link
                href="/"
                className="flex items-baseline gap-1.5 md:gap-2 text-accent hover:opacity-80 transition-opacity"
              >
                <BrandGlyph size={20} className="self-center shrink-0" />
                <span className="font-display text-2xl md:text-3xl leading-none italic">
                  Distil
                </span>
              </Link>
              <span className="hidden sm:inline text-border" aria-hidden="true">
                |
              </span>
              <span className="hidden sm:inline font-mono text-[11px] tracking-wider uppercase text-muted-foreground truncate">
                A propos
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/"
                className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground hover:text-accent transition-colors"
              >
                ← Accueil
              </Link>
              <span className="text-border" aria-hidden="true">
                |
              </span>
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Hero */}
        <BrandGlyph
          size={96}
          className="text-accent mb-8 md:mb-10"
          title="Distil"
        />
        <h1 className="font-display text-5xl md:text-7xl leading-[0.95] tracking-[-0.01em] text-foreground mb-8 md:mb-10 text-balance">
          Veille intelligente,{' '}
          <em className="italic text-accent">lecture souveraine.</em>
        </h1>
        <p className="font-body text-lg md:text-xl text-muted-foreground leading-[1.6] mb-16 text-pretty">
          Distil capte, filtre et organise l&apos;information en ligne pour qu&apos;elle reste au
          service du jugement humain.
        </p>

        {/* Mission */}
        <section className="relative border-t border-border pt-8 mb-14">
          <span
            aria-hidden
            className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-accent inline-flex"
          >
            <BrandGlyph size={14} />
          </span>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-6">
            Chapitre I · Mission
          </p>
          <ul className="space-y-8">
            <li>
              <h3 className="font-display text-2xl md:text-3xl text-foreground leading-[1.15] mb-2">
                Le jugement humain pilote l&apos;algo
              </h3>
              <p className="font-body text-[16px] text-muted-foreground leading-[1.6] text-pretty">
                L&apos;IA propose, trie, resume. Vous decidez ce qui compte. Aucun mecanisme de
                scoring n&apos;est opaque ni irreversible.
              </p>
            </li>
            <li>
              <h3 className="font-display text-2xl md:text-3xl text-foreground leading-[1.15] mb-2">
                Transparence comme pilier
              </h3>
              <p className="font-body text-[16px] text-muted-foreground leading-[1.6] text-pretty">
                Chaque score, chaque signal de curation expose sa source. Si on ne peut pas
                expliquer pourquoi un article remonte, il ne remonte pas.
              </p>
            </li>
            <li>
              <h3 className="font-display text-2xl md:text-3xl text-foreground leading-[1.15] mb-2">
                Diversite by design
              </h3>
              <p className="font-body text-[16px] text-muted-foreground leading-[1.6] text-pretty">
                Le systeme introduit activement des signaux hors-bulle. La decouverte n&apos;est pas
                un effet de bord, c&apos;est une feature de premier rang.
              </p>
            </li>
          </ul>
        </section>

        {/* Contact */}
        <section className="relative border-t border-border pt-8 mb-14">
          <span
            aria-hidden
            className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-accent inline-flex"
          >
            <BrandGlyph size={14} />
          </span>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-6">
            Chapitre II · Contact
          </p>
          <p className="font-body text-[16px] text-muted-foreground leading-[1.6] text-pretty">
            Pour toute question, demande ou retour, ouvrez une issue sur{' '}
            <a
              href="https://github.com/Vandanael/distil/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:text-accent transition-colors underline underline-offset-2"
            >
              GitHub
            </a>
            .
          </p>
        </section>

        {/* Mentions legales */}
        <section className="relative border-t border-border pt-8 mb-14">
          <span
            aria-hidden
            className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-accent inline-flex"
          >
            <BrandGlyph size={14} />
          </span>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-6">
            Chapitre III · Mentions legales
          </p>
          <div className="space-y-4 font-body text-[15px] text-muted-foreground leading-[1.6] text-pretty">
            <p>
              Responsable du traitement : Yvan Forestier. Les donnees collectees (email, profil de
              veille, articles lus) servent exclusivement a fournir le service et ne sont jamais
              revendues.
            </p>
            <p>
              Droit a l&apos;oubli : sur simple demande via une issue GitHub, votre compte et
              l&apos;ensemble de vos donnees sont supprimes sous 30 jours.
            </p>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em]">
              © 2026-{year} Distil. Tous droits reserves.
            </p>
          </div>
        </section>
      </div>
      <PublicFooter />
    </main>
  )
}
