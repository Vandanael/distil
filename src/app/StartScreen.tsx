'use client'

import Link from 'next/link'
import { Fragment } from 'react'
import { PublicFooter } from '@/components/PublicFooter'
import { PublicHeader } from '@/components/PublicHeader'
import { ArticleRow } from '@/components/ArticleRow'
import { DEMO_ACCOUNTS, type DemoAccountSlug } from '@/lib/demo-accounts'
import { useLocale } from '@/lib/i18n/context'

// Wrappe chaque "Distil" du texte dans un span accent (le wordmark reste toujours orange).
function withBrand(text: string) {
  const parts = text.split(/(Distil)/g)
  return parts.map((part, i) =>
    part === 'Distil' ? (
      <span key={i} className="text-accent">
        Distil
      </span>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    )
  )
}

type FeaturedArticle = {
  title: string | null
  url: string | null
  site_name: string | null
  excerpt: string | null
  score: number | null
  is_serendipity: boolean
  justification: string | null
  persona_slug: DemoAccountSlug | null
}

const PERSONA_EXAMPLES = [
  {
    slug: 'pm',
    label: { fr: 'Politique & Monde', en: 'Politics & World' },
    description: {
      fr: 'Géopolitique, démocratie, actualité internationale',
      en: 'Geopolitics, democracy, international news',
    },
  },
  {
    slug: 'consultant',
    label: { fr: 'Cuisine & Gastronomie', en: 'Food & Gastronomy' },
    description: {
      fr: 'Techniques, chefs, restaurants, recettes',
      en: 'Techniques, chefs, restaurants, recipes',
    },
  },
  {
    slug: 'dev',
    label: { fr: 'Tech & Numérique', en: 'Tech & Digital' },
    description: { fr: 'Actualité tech, outils, open source', en: 'Tech news, tools, open source' },
  },
]

const COPY = {
  fr: {
    taglineLead: 'Votre veille quotidienne,',
    taglineTail: 'sans le bruit.',
    body: "Chaque matin, on lit le web à votre place et on ne garde que ce qui compte vraiment - filtré par vos centres d'intérêt, pas par un algorithme de popularité.",
    format: 'Une page à consulter chaque matin. Rien dans votre boîte mail.',
    cta: 'Commencer',
    loginNav: 'Connexion',
    howTitle: 'Comment Distil trie',
    howDeck: {
      lead: 'Distil ne classe pas par likes comme Feedly, ni par viralité comme Artifact.',
      kicker: 'Le sens avant le signal.',
    },
    howSteps: [
      {
        kicker: 'Filtrer',
        body: "On analyse jusqu'à 40 articles de votre veille chaque matin et on en garde 5 à 8. Les plus denses, les mieux sourcés.",
      },
      {
        kicker: 'Surprendre',
        body: "1 à 2 sélections par édition viennent d'un domaine que vous ne lisez jamais. La diversité n'est pas un effet de bord, c'est une règle.",
      },
      {
        kicker: 'Expliquer',
        body: "Chaque sélection affiche son score et la raison du choix. Vous gardez la main, l'algo rend des comptes.",
      },
    ],
    foundationsNote:
      "Méthode enracinée dans la recherche sur les bulles de filtres, l'économie de l'attention et la sérendipité.",
    foundationsCta: 'Voir les fondations',
    examplesTitle: 'Voir un exemple',
    examplesSubtitle:
      "Choisissez un thème pour voir à quoi ressemble votre sélection d'aujourd'hui.",
    feedTitle: 'La veille du jour',
    feedTitleFallback: 'Exemples éditoriaux',
    feedEmpty: 'Distil analyse le web en ce moment. Revenez dans quelques minutes.',
    serendipity: 'Découverte',
    relevance: 'Pertinence',
    noTitle: 'Sans titre',
    editionsTodaySingular: 'édition filtrée ce matin',
    editionsTodayPlural: 'éditions filtrées ce matin',
    onboardingPromise: '1 minute, 2 questions, gratuit pendant la beta.',
    previewCta: 'Voir les 2 questions',
  },
  en: {
    taglineLead: 'Your daily briefing,',
    taglineTail: 'without noise.',
    body: 'Every morning, we read the web for you and keep only what truly matters - filtered by your interests, not by a popularity algorithm.',
    format: 'One page to check each morning. Nothing in your inbox.',
    cta: 'Get started',
    loginNav: 'Sign in',
    howTitle: 'How Distil sorts',
    howDeck: {
      lead: "Distil doesn't rank by likes like Feedly, or by virality like Artifact.",
      kicker: 'Meaning over signal.',
    },
    howSteps: [
      {
        kicker: 'Filter',
        body: 'We scan up to 40 articles from your feeds each morning and keep 5 to 8. The densest, the best sourced.',
      },
      {
        kicker: 'Surprise',
        body: 'One or two picks per edition come from a domain you never read. Diversity is not a side-effect, it is a rule.',
      },
      {
        kicker: 'Explain',
        body: 'Every pick shows its score and the reason. You stay in charge, the algo is accountable.',
      },
    ],
    foundationsNote:
      'Method grounded in research on filter bubbles, the attention economy, and serendipity.',
    foundationsCta: 'See the foundations',
    examplesTitle: 'See an example',
    examplesSubtitle: "Pick a topic to preview today's selection.",
    feedTitle: "Today's briefing",
    feedTitleFallback: 'Editorial samples',
    feedEmpty: 'Distil is scanning the web right now. Check back in a few minutes.',
    serendipity: 'Discovery',
    relevance: 'Relevance',
    noTitle: 'No title',
    editionsTodaySingular: 'edition filtered this morning',
    editionsTodayPlural: 'editions filtered this morning',
    onboardingPromise: '1 minute, 2 questions, free during beta.',
    previewCta: 'See the 2 questions',
  },
}

export function StartScreen({
  articles,
  isFallback = false,
  editionsToday = 0,
}: {
  articles: FeaturedArticle[]
  isFallback?: boolean
  editionsToday?: number
}) {
  const { locale } = useLocale()
  const t = COPY[locale]
  const feedHeading = isFallback ? t.feedTitleFallback : t.feedTitle

  return (
    <main className="flex-1 flex flex-col bg-background overflow-x-clip">
      {/* Masthead partage public, pleine largeur */}
      <div data-rise style={{ ['--rise-delay' as string]: '0' }}>
        <PublicHeader />
      </div>
      <div className="flex-1 w-full max-w-2xl lg:max-w-5xl xl:max-w-6xl mx-auto px-5 md:px-8 pt-8 md:pt-12">
        <div className="w-full">
          {/* Hero : tagline compacte, CTA, puis edition du jour (asymetrie desktop) */}
          <div className="relative lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:gap-16 xl:gap-24 lg:items-start mb-16 md:mb-24 lg:mb-28 xl:mb-36">
            <div className="relative space-y-7 md:space-y-8 mb-12 lg:mb-0">
              <h1
                data-rise
                style={{ ['--rise-delay' as string]: '1' }}
                className="font-display text-foreground text-[3rem] sm:text-6xl md:text-7xl lg:text-[5.5rem] xl:text-[6.5rem] leading-[0.95] tracking-[-0.02em] text-balance"
              >
                {t.taglineLead}{' '}
                <span className="text-accent whitespace-nowrap">{t.taglineTail}</span>
              </h1>
              <p
                data-rise
                style={{ ['--rise-delay' as string]: '2' }}
                className="font-body text-lg md:text-xl text-subtle leading-[1.55] max-w-[44ch] text-pretty"
              >
                {withBrand(t.body)}
              </p>
              <p
                data-rise
                style={{ ['--rise-delay' as string]: '3' }}
                className="font-ui text-[15px] text-subtle"
              >
                {t.format}
              </p>
              <div
                data-rise
                style={{ ['--rise-delay' as string]: '4' }}
                className="pt-2 md:pt-3 space-y-4"
              >
                <Link
                  href="/login"
                  className="inline-flex items-center font-ui text-[15px] md:text-[16px] uppercase tracking-[0.08em] bg-foreground text-background px-6 py-3.5 md:px-7 md:py-4 hover:bg-accent focus-visible:bg-accent transition-colors"
                >
                  {t.cta}
                </Link>
                <p className="font-ui text-[14px] text-subtle">
                  {t.onboardingPromise}{' '}
                  <Link
                    href="/onboarding/preview"
                    className="underline underline-offset-[3px] decoration-border hover:decoration-accent hover:text-accent transition-colors"
                  >
                    {t.previewCta}
                  </Link>
                </p>
                {editionsToday > 0 && (
                  <p className="font-ui text-[14px] text-subtle">
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full bg-accent align-middle mr-2"
                      aria-hidden
                    />
                    <span className="tabular-nums text-foreground">{editionsToday}</span>{' '}
                    {editionsToday === 1 ? t.editionsTodaySingular : t.editionsTodayPlural}
                  </p>
                )}
              </div>
            </div>

            {/* Edition du jour : aplat subtil + decalage vertical desktop pour asymetrie */}
            <aside
              data-rise
              style={{ ['--rise-delay' as string]: '5' }}
              className="relative lg:translate-y-8 xl:translate-y-12"
            >
              <div
                aria-hidden
                className="hidden lg:block pointer-events-none absolute -inset-x-6 -inset-y-8 bg-accent/[0.06]"
              />
              <div className="relative border-t border-border pt-4 mb-3">
                <h2 className="font-ui text-[15px] text-accent uppercase tracking-[0.12em]">
                  {feedHeading}
                </h2>
              </div>
              <div className="relative">
                {articles.length > 0 ? (
                  <ul>
                    {articles.map((article, i) => {
                      const persona = article.persona_slug
                        ? DEMO_ACCOUNTS.find((a) => a.slug === article.persona_slug)
                        : null
                      const personaLabel = persona ? persona.label[locale] : undefined
                      return (
                        <ArticleRow
                          key={article.url ?? String(i)}
                          article={article}
                          lang={locale}
                          noTitleLabel={t.noTitle}
                          serendipityLabel={t.serendipity}
                          relevanceLabel={t.relevance}
                          personaLabel={personaLabel}
                          compact
                        />
                      )
                    })}
                  </ul>
                ) : (
                  <p className="font-body text-[15px] text-subtle italic py-4">
                    {withBrand(t.feedEmpty)}
                  </p>
                )}
              </div>
            </aside>
          </div>

          {/* Methode : pitch vulgarise */}
          <section className="mb-16 md:mb-24 border-t border-border pt-8 md:pt-10">
            <h2 className="font-heading text-4xl md:text-5xl text-foreground leading-[1.1] tracking-tight mb-4 md:mb-5 text-balance max-w-[22ch]">
              {withBrand(t.howTitle)}
            </h2>
            <p className="font-body text-[17px] md:text-lg text-subtle leading-[1.55] mb-8 md:mb-10 max-w-[52ch] lg:max-w-[72ch] text-pretty">
              {withBrand(t.howDeck.lead)}{' '}
              <em className="not-italic text-foreground">
                <span className="italic text-accent whitespace-nowrap">{t.howDeck.kicker}</span>
              </em>
            </p>
            <ol className="grid gap-8 md:gap-10 md:grid-cols-3">
              {t.howSteps.map((step) => (
                <li
                  key={step.kicker}
                  className="space-y-4 md:space-y-5 md:border-l md:border-border md:pl-6 first:md:border-l-0 first:md:pl-0"
                >
                  <h3 className="font-ui text-xl md:text-2xl font-semibold tracking-tight text-accent">
                    {step.kicker}
                  </h3>
                  <p className="font-body text-[17px] md:text-lg text-foreground leading-[1.55] text-pretty">
                    {withBrand(step.body)}
                  </p>
                </li>
              ))}
            </ol>
            <p className="font-ui text-[14px] text-subtle leading-[1.55] mt-10 md:mt-12 max-w-[52ch] text-pretty">
              {t.foundationsNote}{' '}
              <Link
                href="/about#fondations"
                className="underline underline-offset-[3px] decoration-border hover:decoration-accent hover:text-accent transition-colors"
              >
                {t.foundationsCta}
              </Link>
              .
            </p>
          </section>

          {/* Voir un exemple : liens compacts, aplat full-viewport */}
          <section id="examples" className="relative pt-8 md:pt-10 pb-8 md:pb-10 scroll-mt-8">
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-screen bg-accent/[0.06]"
            />
            <div className="relative">
              <div className="mb-6 md:mb-8">
                <h2 className="font-heading text-4xl md:text-5xl text-foreground leading-[1.1] tracking-tight mb-3 text-balance">
                  {t.examplesTitle}
                </h2>
                <p className="font-body text-[16px] md:text-[17px] text-subtle leading-[1.55] text-pretty">
                  {t.examplesSubtitle}
                </p>
              </div>
              <ul className="divide-y divide-border">
                {PERSONA_EXAMPLES.map((p) => (
                  <li key={p.slug}>
                    <Link href={`/demo/${p.slug}`} className="group relative block">
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 w-screen group-hover:bg-accent/[0.14] transition-colors"
                      />
                      <span className="relative flex items-baseline gap-6 md:gap-10 py-4 md:py-5 px-4 md:px-6">
                        <span className="flex-1 flex flex-col md:flex-row md:items-baseline md:gap-8 gap-1 min-w-0">
                          <span className="font-ui text-xl md:text-2xl font-semibold text-foreground leading-tight tracking-tight group-hover:text-accent transition-colors md:w-64 shrink-0">
                            {p.label[locale]}
                          </span>
                          <span className="font-body text-[15px] md:text-[16px] text-subtle leading-snug flex-1">
                            {p.description[locale]}
                          </span>
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </div>
      <PublicFooter lang={locale} />
    </main>
  )
}
