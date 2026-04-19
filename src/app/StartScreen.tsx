'use client'

import Link from 'next/link'
import { Fragment, useState } from 'react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { PublicFooter } from '@/components/PublicFooter'
import { Masthead } from '@/components/Masthead'
import { ArticleRow } from '@/components/ArticleRow'

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
    ),
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
    howSteps: [
      {
        kicker: 'Filtrer',
        body: "On lit 300 à 500 articles de votre veille chaque matin et on en garde 6 à 10. Les plus denses, les mieux sourcés.",
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
    examplesTitle: 'Voir un exemple',
    examplesSubtitle: "Choisissez un thème pour voir à quoi ressemble votre sélection d'aujourd'hui.",
    feedTitle: 'La veille du jour',
    feedTitleFallback: 'Exemples éditoriaux',
    feedSub: 'Extrait de veilles actives',
    feedEmpty: 'Distil analyse le web en ce moment. Revenez dans quelques minutes.',
    serendipity: 'Découverte',
    relevance: 'Pertinence',
    noTitle: 'Sans titre',
  },
  en: {
    taglineLead: 'Your daily briefing,',
    taglineTail: 'without the noise.',
    body: 'Every morning, we read the web for you and keep only what truly matters - filtered by your interests, not by a popularity algorithm.',
    format: 'One page to check each morning. Nothing in your inbox.',
    cta: 'Get started',
    loginNav: 'Sign in',
    howTitle: 'How Distil sorts',
    howSteps: [
      {
        kicker: 'Filter',
        body: 'We read 300 to 500 articles from your feeds each morning and keep 6 to 10. The densest, the best sourced.',
      },
      {
        kicker: 'Surprise',
        body: "One or two picks per edition come from a domain you never read. Diversity is not a side-effect, it is a rule.",
      },
      {
        kicker: 'Explain',
        body: 'Every pick shows its score and the reason. You stay in charge, the algo is accountable.',
      },
    ],
    examplesTitle: 'See an example',
    examplesSubtitle: "Pick a topic to preview today's selection.",
    feedTitle: "Today's briefing",
    feedTitleFallback: 'Editorial samples',
    feedSub: 'From active feeds',
    feedEmpty: 'Distil is scanning the web right now. Check back in a few minutes.',
    serendipity: 'Discovery',
    relevance: 'Relevance',
    noTitle: 'No title',
  },
}

export function StartScreen({
  articles,
  isFallback = false,
}: {
  articles: FeaturedArticle[]
  isFallback?: boolean
}) {
  const [lang, setLang] = useState<'fr' | 'en'>('fr')
  const t = COPY[lang]
  const feedHeading = isFallback ? t.feedTitleFallback : t.feedTitle

  const today = new Date().toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <main className="min-h-full flex flex-col px-5 md:px-8 py-5 md:py-10 bg-background">
      <div className="w-full max-w-2xl lg:max-w-5xl xl:max-w-6xl mx-auto flex-1">
        {/* Masthead editorial */}
        <div
          data-rise
          style={{ ['--rise-delay' as string]: '0' }}
          className="mb-12 md:mb-20"
        >
          <Masthead
            date={today}
            rightSlot={
              <>
                <Link
                  href="/login"
                  className="inline-flex items-center h-full font-ui text-[15px] px-2 text-subtle hover:text-accent transition-colors"
                >
                  {t.loginNav}
                </Link>
                <span className="text-border text-[15px] leading-none" aria-hidden="true">
                  |
                </span>
                <button
                  onClick={() => setLang('fr')}
                  aria-pressed={lang === 'fr'}
                  aria-label="Français"
                  className={`inline-flex items-center h-full font-ui text-[15px] px-2 transition-colors ${lang === 'fr' ? 'text-foreground' : 'text-subtle hover:text-foreground'}`}
                >
                  FR
                </button>
                <span className="text-border text-[15px] leading-none" aria-hidden="true">
                  ·
                </span>
                <button
                  onClick={() => setLang('en')}
                  aria-pressed={lang === 'en'}
                  aria-label="English"
                  className={`inline-flex items-center h-full font-ui text-[15px] px-2 transition-colors ${lang === 'en' ? 'text-foreground' : 'text-subtle hover:text-foreground'}`}
                >
                  EN
                </button>
                <span className="text-border text-[15px] leading-none" aria-hidden="true">
                  |
                </span>
                <ThemeToggle />
              </>
            }
          />
        </div>

        {/* Hero : tagline compacte, CTA, puis edition du jour (asymetrie desktop) */}
        <div className="relative lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:gap-16 xl:gap-24 lg:items-start mb-16 md:mb-24">
          <div className="relative space-y-7 md:space-y-8 mb-12 lg:mb-0">
            <h1
              data-rise
              style={{ ['--rise-delay' as string]: '1' }}
              className="font-display text-foreground text-[3rem] sm:text-6xl md:text-7xl lg:text-[5.5rem] xl:text-[6.5rem] leading-[0.95] tracking-[-0.02em] text-balance"
            >
              {t.taglineLead}{' '}
              <em className="not-italic">
                <span className="italic text-accent whitespace-nowrap">{t.taglineTail}</span>
              </em>
            </h1>
            <p
              data-rise
              style={{ ['--rise-delay' as string]: '2' }}
              className="font-body text-lg md:text-xl text-subtle leading-[1.55] max-w-[44ch] text-pretty"
            >
              {withBrand(t.body)}
            </p>
            <div data-rise style={{ ['--rise-delay' as string]: '3' }} className="pt-1">
              <Link
                href="/login"
                className="inline-flex items-center font-ui text-[15px] md:text-[16px] uppercase tracking-[0.08em] bg-foreground text-background px-6 py-3.5 md:px-7 md:py-4 hover:bg-accent focus-visible:bg-accent transition-colors"
              >
                {t.cta}
              </Link>
            </div>
            <p
              data-rise
              style={{ ['--rise-delay' as string]: '4' }}
              className="font-ui text-[15px] text-subtle"
            >
              {t.format}
            </p>
          </div>

          {/* Edition du jour : aplat subtil + decalage vertical desktop pour asymetrie */}
          <aside
            data-rise
            style={{ ['--rise-delay' as string]: '5' }}
            className="relative lg:translate-y-16 xl:translate-y-24"
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
                  {articles.map((article, i) => (
                    <ArticleRow
                      key={article.url ?? String(i)}
                      article={article}
                      lang={lang}
                      noTitleLabel={t.noTitle}
                      serendipityLabel={t.serendipity}
                      relevanceLabel={t.relevance}
                      compact
                    />
                  ))}
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
          <h2 className="font-display text-4xl md:text-5xl text-foreground leading-[0.95] tracking-[-0.01em] mb-8 md:mb-10 text-balance max-w-[22ch]">
            {withBrand(t.howTitle)}
          </h2>
          <ol className="grid gap-8 md:gap-10 md:grid-cols-3 max-w-[88ch]">
            {t.howSteps.map((step) => (
              <li key={step.kicker} className="space-y-4 md:space-y-5 md:border-l md:border-border md:pl-6 first:md:border-l-0 first:md:pl-0">
                <h3 className="font-display text-3xl md:text-4xl text-accent leading-[0.95] tracking-[-0.01em]">
                  {step.kicker}
                </h3>
                <p className="font-body text-[17px] md:text-lg text-foreground leading-[1.55] text-pretty">
                  {withBrand(step.body)}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* Voir un exemple : liens compacts */}
        <section className="mb-16 md:mb-24 border-t border-border pt-8 md:pt-10">
          <div className="mb-6 md:mb-8">
            <h2 className="font-display text-4xl md:text-5xl text-foreground leading-[0.95] tracking-[-0.01em] mb-3 text-balance">
              {t.examplesTitle}
            </h2>
            <p className="font-body text-[16px] md:text-[17px] text-subtle leading-[1.55] max-w-[48ch] text-pretty">
              {t.examplesSubtitle}
            </p>
          </div>
          <div className="relative">
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-x-4 -inset-y-4 md:-inset-x-6 md:-inset-y-6 bg-accent/[0.06]"
            />
            <ul className="relative divide-y divide-border border-t border-b border-border bg-background">
              {PERSONA_EXAMPLES.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/demo/${p.slug}`}
                    className="group flex items-baseline gap-6 md:gap-10 py-4 md:py-5 px-4 md:px-6 hover:bg-muted/50 transition-colors"
                  >
                    <span className="flex-1 flex flex-col md:flex-row md:items-baseline md:gap-8 gap-1 min-w-0">
                      <span className="font-display text-2xl md:text-3xl text-foreground leading-tight group-hover:text-accent transition-colors md:w-64 shrink-0">
                        {p.label[lang]}
                      </span>
                      <span className="font-body text-[15px] md:text-[16px] text-subtle leading-snug flex-1">
                        {p.description[lang]}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
      <PublicFooter lang={lang} />
    </main>
  )
}
