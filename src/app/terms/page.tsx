import { PublicFooter } from '@/components/PublicFooter'
import { PublicHeader } from '@/components/PublicHeader'

export const metadata = {
  title: 'Terms of Use - Distil',
  description: "Terms of use and conditions d'utilisation - Distil news curation service.",
  robots: { index: true, follow: true },
  alternates: { canonical: '/terms' },
}

export default function TermsPage() {
  return (
    <main className="flex-1 flex flex-col bg-background">
      <PublicHeader contextLabel="Conditions" />
      <div className="flex-1 w-full max-w-2xl mx-auto px-5 md:px-8 pt-12 md:pt-16 pb-10 md:pb-16">
        {/* EN condensed */}
        <section lang="en" className="mb-14 pb-12 border-b border-border">
          <h1 className="font-display text-4xl md:text-5xl leading-[0.95] tracking-[-0.01em] text-foreground mb-4">
            Terms of Use
          </h1>
          <p className="font-ui text-[14px] text-muted-foreground mb-10">
            English summary - Beta version - Last updated: April 21, 2026
          </p>
          <div className="space-y-4 font-body text-[15px] text-muted-foreground leading-[1.6] text-pretty">
            <p>
              This is a condensed English summary of Distil&apos;s terms of use. The full version is
              available in French below.
            </p>
            <p>
              <strong className="text-foreground">Service:</strong> Distil is a beta-stage personal
              news curation service, accessible by invitation. It is free during the beta period and
              may evolve or be interrupted without notice.
            </p>
            <p>
              <strong className="text-foreground">Access:</strong> invitation required,
              authentication via Google OAuth only, one account per person. Account sharing is not
              permitted.
            </p>
            <p>
              <strong className="text-foreground">Acceptable use:</strong> Distil is a personal
              reading tool. Commercial use, accessing other users&apos; data, and automated
              mass-requests without prior agreement are prohibited.
            </p>
            <p>
              <strong className="text-foreground">Intellectual property:</strong> articles displayed
              belong to their respective publishers. Distil always links back to the original
              source. The interface, scoring algorithms, and curation logic are Distil&apos;s own.
            </p>
            <p>
              <strong className="text-foreground">Liability:</strong> provided as-is during beta,
              without guarantees of availability or editorial completeness.
            </p>
            <p>
              <strong className="text-foreground">Account deletion:</strong> you may delete your
              account at any time from app settings or by contacting{' '}
              <a
                href="mailto:hello@distil.app"
                className="text-foreground hover:text-accent transition-colors underline underline-offset-[3px] hover:decoration-2"
              >
                hello@distil.app
              </a>
              .
            </p>
            <p>Governing law: French law. Jurisdiction: Paris courts.</p>
            <p>
              <a
                href="#conditions-fr"
                className="text-foreground hover:text-accent transition-colors underline underline-offset-[3px] hover:decoration-2"
              >
                Full terms of use available in French below.
              </a>
            </p>
          </div>
        </section>

        {/* FR complète */}
        <div id="conditions-fr" className="scroll-mt-8">
          <h2 className="font-display text-4xl md:text-5xl leading-[0.95] tracking-[-0.01em] text-foreground mb-4 pt-2">
            Conditions d&apos;utilisation
          </h2>
          <p className="font-ui text-[14px] text-muted-foreground mb-12">
            Dernière mise à jour : 21 avril 2026 - Version bêta
          </p>

          <section className="mb-10 space-y-4">
            <h3 className="font-ui text-[15px] text-accent uppercase tracking-[0.12em]">
              1. Nature du service
            </h3>
            <p className="font-body text-[15px] text-muted-foreground leading-[1.6] text-pretty">
              Distil est un service de curation de veille en version bêta, accessible sur
              invitation. En tant que version bêta, le service peut évoluer, être interrompu ou
              modifié sans préavis. L&apos;accès est gratuit pendant cette période.
            </p>
          </section>

          <section className="mb-10 space-y-4">
            <h3 className="font-ui text-[15px] text-accent uppercase tracking-[0.12em]">
              2. Conditions d&apos;accès
            </h3>
            <ul className="space-y-3 font-body text-[15px] text-muted-foreground leading-[1.6]">
              <li className="flex gap-3">
                <span
                  className="mt-[0.4em] w-1.5 h-1.5 rounded-full bg-border shrink-0"
                  aria-hidden
                />
                <span>L&apos;accès est réservé aux personnes ayant reçu une invitation.</span>
              </li>
              <li className="flex gap-3">
                <span
                  className="mt-[0.4em] w-1.5 h-1.5 rounded-full bg-border shrink-0"
                  aria-hidden
                />
                <span>L&apos;authentification s&apos;effectue exclusivement via Google OAuth.</span>
              </li>
              <li className="flex gap-3">
                <span
                  className="mt-[0.4em] w-1.5 h-1.5 rounded-full bg-border shrink-0"
                  aria-hidden
                />
                <span>Un compte par personne. Le partage de compte n&apos;est pas autorisé.</span>
              </li>
            </ul>
          </section>

          <section className="mb-10 space-y-4">
            <h3 className="font-ui text-[15px] text-accent uppercase tracking-[0.12em]">
              3. Usage acceptable
            </h3>
            <p className="font-body text-[15px] text-muted-foreground leading-[1.6] text-pretty">
              Distil est un outil de veille personnelle. Il est interdit de :
            </p>
            <ul className="space-y-3 font-body text-[15px] text-muted-foreground leading-[1.6]">
              <li className="flex gap-3">
                <span
                  className="mt-[0.4em] w-1.5 h-1.5 rounded-full bg-border shrink-0"
                  aria-hidden
                />
                <span>Utiliser le service à des fins commerciales sans accord préalable.</span>
              </li>
              <li className="flex gap-3">
                <span
                  className="mt-[0.4em] w-1.5 h-1.5 rounded-full bg-border shrink-0"
                  aria-hidden
                />
                <span>
                  Tenter de contourner les limites techniques ou d&apos;accéder à des données
                  d&apos;autres utilisateurs.
                </span>
              </li>
              <li className="flex gap-3">
                <span
                  className="mt-[0.4em] w-1.5 h-1.5 rounded-full bg-border shrink-0"
                  aria-hidden
                />
                <span>
                  Automatiser massivement les requêtes (scraping, bots) sans accord préalable.
                </span>
              </li>
            </ul>
          </section>

          <section className="mb-10 space-y-4">
            <h3 className="font-ui text-[15px] text-accent uppercase tracking-[0.12em]">
              4. Propriété intellectuelle
            </h3>
            <p className="font-body text-[15px] text-muted-foreground leading-[1.6] text-pretty">
              Les articles affichés dans Distil appartiennent à leurs éditeurs respectifs. Distil
              n&apos;en revendique pas la propriété et renvoie systématiquement vers la source
              originale pour la lecture complète.
            </p>
            <p className="font-body text-[15px] text-muted-foreground leading-[1.6] text-pretty">
              L&apos;interface, le design, les algorithmes de scoring et de curation sont la
              propriété de Distil.
            </p>
          </section>

          <section className="mb-10 space-y-4">
            <h3 className="font-ui text-[15px] text-accent uppercase tracking-[0.12em]">
              5. Limitation de responsabilité
            </h3>
            <p className="font-body text-[15px] text-muted-foreground leading-[1.6] text-pretty">
              Distil est fourni en version bêta, sans garantie de disponibilité continue ni
              d&apos;exhaustivité de la curation. Le service ne peut être tenu responsable du
              contenu des articles indexés, qui relève de la responsabilité de leurs éditeurs.
            </p>
          </section>

          <section className="mb-10 space-y-4">
            <h3 className="font-ui text-[15px] text-accent uppercase tracking-[0.12em]">
              6. Modifications et résiliation
            </h3>
            <p className="font-body text-[15px] text-muted-foreground leading-[1.6] text-pretty">
              Ces conditions peuvent évoluer. Tout changement significatif sera communiqué aux
              utilisateurs actifs par email. Vous pouvez supprimer votre compte à tout moment depuis
              les paramètres de l&apos;application ou en écrivant à{' '}
              <a
                href="mailto:hello@distil.app"
                className="text-foreground hover:text-accent transition-colors underline underline-offset-[3px] hover:decoration-2"
              >
                hello@distil.app
              </a>
              .
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="font-ui text-[15px] text-accent uppercase tracking-[0.12em]">
              7. Droit applicable
            </h3>
            <p className="font-body text-[15px] text-muted-foreground leading-[1.6] text-pretty">
              Les présentes conditions sont soumises au droit français. Tout litige sera soumis aux
              tribunaux compétents de Paris.
            </p>
          </section>
        </div>
      </div>
      <PublicFooter />
    </main>
  )
}
