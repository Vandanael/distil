import Image from 'next/image'
import { PublicFooter } from '@/components/PublicFooter'
import { PublicHeader } from '@/components/PublicHeader'
import { BrandGlyph } from '@/components/BrandGlyph'
import { AboutMethodSection } from '@/components/AboutMethodSection'

const ABOUT_DESCRIPTION =
  'Distil est une veille intelligente et un read-later personnel. Curation IA transparente, diversité éditoriale by design.'

export const metadata = {
  title: 'A propos',
  description: ABOUT_DESCRIPTION,
  robots: { index: true, follow: true },
  openGraph: {
    title: 'A propos de Distil',
    description: ABOUT_DESCRIPTION,
    url: '/about',
  },
  twitter: {
    title: 'A propos de Distil',
    description: ABOUT_DESCRIPTION,
  },
  alternates: { canonical: '/about' },
}

export default function AboutPage() {
  return (
    <main className="flex-1 flex flex-col bg-background">
      <PublicHeader contextLabel="À propos" />
      <div className="flex-1 w-full max-w-2xl mx-auto px-5 md:px-8 pt-12 md:pt-16 pb-5 md:pb-10">
        {/* Hero */}
        <BrandGlyph size={96} className="text-accent mb-8 md:mb-10" title="Distil" />
        <h1 className="font-display text-5xl md:text-7xl leading-[0.95] tracking-[-0.01em] text-foreground mb-12 md:mb-16 text-balance">
          Veille intelligente, <em className="italic text-accent">lecture sereine.</em>
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
          <figcaption className="mt-3 font-mono text-sm uppercase tracking-[0.18em] text-muted-foreground">
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

        {/* Méthode */}
        <AboutMethodSection />

        {/* Fondations */}
        <section
          id="fondations"
          className="mb-14 md:mb-16 border-t border-border pt-8 md:pt-10 scroll-mt-8"
        >
          <h2 className="font-display text-4xl md:text-5xl text-foreground leading-[0.95] tracking-[-0.01em] mb-6 md:mb-8 text-balance">
            Fondations.
          </h2>
          <p className="font-body text-[16px] text-muted-foreground leading-[1.6] mb-10 text-pretty">
            Ces principes ne sortent pas d&apos;une opinion. Chacun répond à un phénomène documenté
            par la recherche en sciences de l&apos;information et, plus récemment, en IA appliquée à
            la recommandation.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12">
            {/* Colonne gauche : fondations classiques */}
            <div>
              <p className="font-ui text-[13px] text-accent uppercase tracking-[0.14em] mb-6">
                Fondations classiques
              </p>
              <ul className="space-y-6">
                <li>
                  <h3 className="font-ui text-[15px] text-foreground uppercase tracking-[0.1em] mb-2">
                    Bulles de filtres
                  </h3>
                  <p className="font-body text-[15px] text-muted-foreground leading-[1.6] text-pretty">
                    La personnalisation algorithmique réduit la diversité d&apos;angles et concentre
                    l&apos;exposition sur un nombre restreint de sources. Concept popularisé par{' '}
                    <a
                      href="https://en.wikipedia.org/wiki/Filter_bubble"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground hover:text-accent transition-colors underline underline-offset-[3px] hover:decoration-2"
                    >
                      Eli Pariser (2011)
                    </a>
                    , mesuré chaque année par le{' '}
                    <a
                      href="https://reutersinstitute.politics.ox.ac.uk/digital-news-report"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground hover:text-accent transition-colors underline underline-offset-[3px] hover:decoration-2"
                    >
                      Digital News Report
                    </a>{' '}
                    du Reuters Institute.
                  </p>
                </li>
                <li>
                  <h3 className="font-ui text-[15px] text-foreground uppercase tracking-[0.1em] mb-2">
                    Économie de l&apos;attention
                  </h3>
                  <p className="font-body text-[15px] text-muted-foreground leading-[1.6] text-pretty">
                    Herbert Simon posait en{' '}
                    <a
                      href="https://en.wikipedia.org/wiki/Attention_economy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground hover:text-accent transition-colors underline underline-offset-[3px] hover:decoration-2"
                    >
                      1971
                    </a>{' '}
                    qu&apos;une richesse d&apos;information crée une pauvreté d&apos;attention.
                    Publier dix fois plus ne rend pas le monde dix fois plus lisible.
                  </p>
                </li>
                <li>
                  <h3 className="font-ui text-[15px] text-foreground uppercase tracking-[0.1em] mb-2">
                    Lecture profonde
                  </h3>
                  <p className="font-body text-[15px] text-muted-foreground leading-[1.6] text-pretty">
                    Les circuits cérébraux de lecture attentive se dégradent sous régime de lecture
                    fragmentée. Travaux de Maryanne Wolf, neuroscientifique,{' '}
                    <a
                      href="https://www.maryannewolf.com/reader-come-home"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground hover:text-accent transition-colors underline underline-offset-[3px] hover:decoration-2"
                    >
                      <em>Reader, Come Home</em>
                    </a>{' '}
                    (2018).
                  </p>
                </li>
                <li>
                  <h3 className="font-ui text-[15px] text-foreground uppercase tracking-[0.1em] mb-2">
                    Sérendipité de conception
                  </h3>
                  <p className="font-body text-[15px] text-muted-foreground leading-[1.6] text-pretty">
                    La découverte hors-cible peut être stimulée par un design délibéré, pas
                    seulement par le hasard. Travaux de{' '}
                    <a
                      href="https://www.emerald.com/insight/content/doi/10.1108/00220410310472518/full/html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground hover:text-accent transition-colors underline underline-offset-[3px] hover:decoration-2"
                    >
                      Foster &amp; Ford (2003)
                    </a>{' '}
                    sur la sérendipité dans la recherche d&apos;information.
                  </p>
                </li>
              </ul>
            </div>

            {/* Colonne droite : fondations récentes */}
            <div>
              <p className="font-ui text-[13px] text-accent uppercase tracking-[0.14em] mb-6">
                Fondations récentes - Pourquoi les LLMs
              </p>
              <ul className="space-y-6">
                <li>
                  <h3 className="font-ui text-[15px] text-foreground uppercase tracking-[0.1em] mb-2">
                    Explicabilité des recommandations
                  </h3>
                  <p className="font-body text-[15px] text-muted-foreground leading-[1.6] text-pretty">
                    Les LLMs permettent de générer des justifications lisibles pour chaque
                    recommandation - répondant directement au déficit de transparence des systèmes
                    classiques.{' '}
                    <a
                      href="https://towardsdatascience.com/making-news-recommendations-explainable-with-large-language-models-74f119c7e036/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground hover:text-accent transition-colors underline underline-offset-[3px] hover:decoration-2"
                    >
                      DER SPIEGEL (2025)
                    </a>
                    .
                  </p>
                </li>
                <li>
                  <h3 className="font-ui text-[15px] text-foreground uppercase tracking-[0.1em] mb-2">
                    LLM-Rec
                  </h3>
                  <p className="font-body text-[15px] text-muted-foreground leading-[1.6] text-pretty">
                    Les LLMs augmentent la qualité de la recommandation par compréhension sémantique
                    profonde, sans dépendre de signaux de popularité.{' '}
                    <a
                      href="https://aclanthology.org/2024.findings-naacl.39/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground hover:text-accent transition-colors underline underline-offset-[3px] hover:decoration-2"
                    >
                      NAACL 2024
                    </a>
                    .
                  </p>
                </li>
                <li>
                  <h3 className="font-ui text-[15px] text-foreground uppercase tracking-[0.1em] mb-2">
                    Narratives personnalisées
                  </h3>
                  <p className="font-body text-[15px] text-muted-foreground leading-[1.6] text-pretty">
                    Contextualiser une recommandation par un texte court augmente la pertinence
                    perçue et l&apos;engagement.{' '}
                    <a
                      href="https://research.atspotify.com/2024/12/contextualized-recommendations-through-personalized-narratives-using-llms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground hover:text-accent transition-colors underline underline-offset-[3px] hover:decoration-2"
                    >
                      Spotify Research (2024)
                    </a>
                    .
                  </p>
                </li>
                <li>
                  <h3 className="font-ui text-[15px] text-foreground uppercase tracking-[0.1em] mb-2">
                    Recommandation d&apos;actualités par LLM
                  </h3>
                  <p className="font-body text-[15px] text-muted-foreground leading-[1.6] text-pretty">
                    Synthèse de 50+ travaux sur l&apos;état de l&apos;art des systèmes de
                    recommandation de nouvelles basés sur les LLMs.{' '}
                    <a
                      href="https://arxiv.org/html/2502.09797v1"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground hover:text-accent transition-colors underline underline-offset-[3px] hover:decoration-2"
                    >
                      Survey 2025
                    </a>{' '}
                    et{' '}
                    <a
                      href="https://arxiv.org/html/2403.03424v1"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground hover:text-accent transition-colors underline underline-offset-[3px] hover:decoration-2"
                    >
                      WWW 2024
                    </a>
                    .
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="mb-14 md:mb-16 border-t border-border pt-8 md:pt-10">
          <p className="font-ui text-[15px] text-accent uppercase tracking-[0.12em] mb-4">
            Contact
          </p>
          <p className="font-body text-[16px] text-muted-foreground leading-[1.6] text-pretty">
            Pour toute question ou retour, écrivez à{' '}
            <a
              href="mailto:hello@distil.app"
              className="text-foreground hover:text-accent transition-colors underline underline-offset-[3px] hover:decoration-2"
            >
              hello@distil.app
            </a>
            . Les développeurs peuvent aussi ouvrir une{' '}
            <a
              href="https://github.com/Vandanael/distil/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:text-accent transition-colors underline underline-offset-[3px] hover:decoration-2"
            >
              issue GitHub
            </a>
            .
          </p>
        </section>

        {/* Mentions légales */}
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
              Droit à l&apos;oubli : sur simple demande à{' '}
              <a
                href="mailto:hello@distil.app"
                className="text-foreground hover:text-accent transition-colors underline underline-offset-[3px] hover:decoration-2"
              >
                hello@distil.app
              </a>
              , votre compte et l&apos;ensemble de vos données sont supprimés sous 30 jours.
            </p>
            <p>
              <a
                href="/privacy"
                className="text-foreground hover:text-accent transition-colors underline underline-offset-[3px] hover:decoration-2"
              >
                Politique de confidentialité
              </a>
              {' · '}
              <a
                href="/terms"
                className="text-foreground hover:text-accent transition-colors underline underline-offset-[3px] hover:decoration-2"
              >
                Conditions d&apos;utilisation
              </a>
            </p>
          </div>
        </section>
      </div>
      <PublicFooter />
    </main>
  )
}
