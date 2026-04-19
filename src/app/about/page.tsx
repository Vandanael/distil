import Image from 'next/image'
import { PublicFooter } from '@/components/PublicFooter'
import { PublicHeader } from '@/components/PublicHeader'
import { BrandGlyph } from '@/components/BrandGlyph'

export const metadata = {
  title: 'A propos - Distil',
  description:
    'Distil est une veille intelligente et un read-later personnel. Curation IA transparente, diversite editoriale by design.',
}

export default function AboutPage() {
  return (
    <main className="flex-1 flex flex-col bg-background">
      <div className="pt-5 md:pt-10">
        <PublicHeader contextLabel="À propos" />
      </div>
      <div className="flex-1 w-full max-w-2xl mx-auto px-5 md:px-8 pt-12 md:pt-16 pb-5 md:pb-10">
        {/* Hero */}
        <BrandGlyph size={96} className="text-accent mb-8 md:mb-10" title="Distil" />
        <h1 className="font-display text-5xl md:text-7xl leading-[0.95] tracking-[-0.01em] text-foreground mb-12 md:mb-16 text-balance">
          Veille intelligente, <em className="italic text-accent">lecture souveraine.</em>
        </h1>
        <p className="font-body text-lg md:text-xl text-muted-foreground leading-[1.6] mb-20 md:mb-24 text-pretty">
          <span className="text-accent">Distil</span> capte, filtre et organise l&apos;information
          en ligne pour qu&apos;elle reste au service du jugement humain.
        </p>

        {/* Capture produit */}
        <figure className="mb-14">
          <div className="relative overflow-hidden border border-border bg-[color-mix(in_oklab,var(--color-foreground)_6%,transparent)]">
            <Image
              src="/screenshots/feed-dark.png"
              alt="Capture du feed Distil en mode sombre : liste d'articles sélectionnés du jour avec score de pertinence, badge découverte et justification éditoriale."
              width={1600}
              height={1000}
              priority={false}
              sizes="(min-width: 768px) 672px, 100vw"
              className="w-full h-auto"
            />
          </div>
          <figcaption className="mt-3 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Le feed Distil. Une édition par jour, scores visibles, découvertes marquées.
          </figcaption>
        </figure>

        {/* Principes */}
        <section className="mb-14 md:mb-16 border-t border-border pt-8 md:pt-10">
          <h2 className="font-display text-4xl md:text-5xl text-foreground leading-[0.95] tracking-[-0.01em] mb-8 md:mb-10 text-balance">
            Trois principes.
          </h2>
          <ul className="space-y-8 md:space-y-10">
            <li>
              <h3 className="font-display text-2xl md:text-3xl text-accent leading-[1.15] mb-2">
                Jugement humain
              </h3>
              <p className="font-body text-[16px] text-muted-foreground leading-[1.6] text-pretty">
                L&apos;IA propose, trie, résume. Vous décidez ce qui compte. Aucun mécanisme de
                scoring n&apos;est opaque ni irréversible.
              </p>
            </li>
            <li>
              <h3 className="font-display text-2xl md:text-3xl text-accent leading-[1.15] mb-2">
                Transparence
              </h3>
              <p className="font-body text-[16px] text-muted-foreground leading-[1.6] text-pretty">
                Chaque score, chaque signal de curation expose sa source. Si on ne peut pas
                expliquer pourquoi un article remonte, il ne remonte pas.
              </p>
            </li>
            <li>
              <h3 className="font-display text-2xl md:text-3xl text-accent leading-[1.15] mb-2">
                Diversité
              </h3>
              <p className="font-body text-[16px] text-muted-foreground leading-[1.6] text-pretty">
                Le système introduit activement des signaux hors-bulle. La découverte n&apos;est pas
                un effet de bord, c&apos;est une feature de premier rang.
              </p>
            </li>
          </ul>
        </section>

        {/* Contact */}
        <section className="mb-14 md:mb-16 border-t border-border pt-8 md:pt-10">
          <p className="font-ui text-[15px] text-accent uppercase tracking-[0.12em] mb-4">
            Contact
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
        <section className="border-t border-border pt-8 md:pt-10">
          <p className="font-ui text-[15px] text-accent uppercase tracking-[0.12em] mb-4">
            Mentions légales
          </p>
          <div className="space-y-4 font-body text-[15px] text-muted-foreground leading-[1.6] text-pretty">
            <p>
              Les données collectées (email, profil de veille, articles lus) servent exclusivement à
              fournir le service et ne sont jamais revendues.
            </p>
            <p>
              Droit à l&apos;oubli : sur simple demande via une issue GitHub, votre compte et
              l&apos;ensemble de vos données sont supprimés sous 30 jours.
            </p>
          </div>
        </section>
      </div>
      <PublicFooter />
    </main>
  )
}
