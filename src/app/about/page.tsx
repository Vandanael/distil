import Link from 'next/link'
import { ThemeToggle } from '@/components/ThemeToggle'
import { PublicFooter } from '@/components/PublicFooter'

export const metadata = {
  title: 'A propos - Distil',
  description:
    'Distil est une veille intelligente et un read-later personnel. Curation IA transparente, diversite editoriale by design.',
}

export default function AboutPage() {
  const year = new Date().getFullYear()

  return (
    <main className="min-h-full flex flex-col bg-background">
      <div className="w-full max-w-2xl mx-auto flex-1 px-4 py-6 md:py-16">
        {/* Bandeau editorial */}
        <div className="border-t-2 border-foreground mb-8 pt-3 flex items-center justify-between">
          <span className="font-ui text-xs text-muted-foreground">A propos</span>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/"
              className="font-ui text-xs text-muted-foreground hover:text-accent transition-colors"
            >
              ← Accueil
            </Link>
          </div>
        </div>

        {/* Masthead */}
        <h1 className="font-ui text-5xl md:text-7xl font-bold tracking-tight text-accent leading-none mb-8">
          Distil
        </h1>
        <p className="font-body text-lg md:text-xl text-muted-foreground leading-relaxed mb-12">
          Une veille intelligente et un read-later personnel. Distil capte, filtre et organise
          l&apos;information en ligne pour qu&apos;elle reste au service du jugement humain.
        </p>

        {/* Mission */}
        <section className="border-t border-border pt-8 mb-12">
          <h2 className="font-ui text-xs uppercase tracking-wide text-foreground font-semibold mb-6">
            Mission
          </h2>
          <ul className="space-y-6">
            <li>
              <h3 className="font-ui text-lg font-bold text-foreground mb-1">
                Le jugement humain pilote l&apos;algo
              </h3>
              <p className="font-body text-[15px] text-muted-foreground leading-relaxed">
                L&apos;IA propose, trie, resume. Vous decidez ce qui compte. Aucun mecanisme de
                scoring n&apos;est opaque ni irreversible.
              </p>
            </li>
            <li>
              <h3 className="font-ui text-lg font-bold text-foreground mb-1">
                Transparence comme pilier
              </h3>
              <p className="font-body text-[15px] text-muted-foreground leading-relaxed">
                Chaque score, chaque signal de curation expose sa source. Si on ne peut pas
                expliquer pourquoi un article remonte, il ne remonte pas.
              </p>
            </li>
            <li>
              <h3 className="font-ui text-lg font-bold text-foreground mb-1">
                Diversite by design
              </h3>
              <p className="font-body text-[15px] text-muted-foreground leading-relaxed">
                Le systeme introduit activement des signaux hors-bulle. La decouverte n&apos;est pas
                un effet de bord, c&apos;est une feature de premier rang.
              </p>
            </li>
          </ul>
        </section>

        {/* Contact */}
        <section className="border-t border-border pt-8 mb-12">
          <h2 className="font-ui text-xs uppercase tracking-wide text-foreground font-semibold mb-4">
            Contact
          </h2>
          <p className="font-body text-[15px] text-muted-foreground leading-relaxed">
            Pour toute question, demande ou retour :{' '}
            <a
              href="mailto:yvanforestier@gmail.com"
              className="text-foreground hover:text-accent transition-colors underline underline-offset-2"
            >
              yvanforestier@gmail.com
            </a>
            .
          </p>
        </section>

        {/* Mentions legales */}
        <section className="border-t border-border pt-8 mb-12">
          <h2 className="font-ui text-xs uppercase tracking-wide text-foreground font-semibold mb-4">
            Mentions legales
          </h2>
          <div className="space-y-3 font-body text-[14px] text-muted-foreground leading-relaxed">
            <p>
              Responsable du traitement : Yvan Forestier. Les donnees collectees (email, profil de
              veille, articles lus) servent exclusivement a fournir le service et ne sont jamais
              revendues.
            </p>
            <p>
              Droit a l&apos;oubli : sur simple demande par email, votre compte et l&apos;ensemble
              de vos donnees sont supprimes sous 30 jours.
            </p>
            <p>Copyright © 2026-{year} Distil. Tous droits reserves.</p>
          </div>
        </section>
      </div>
      <PublicFooter />
    </main>
  )
}
