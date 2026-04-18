'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { PublicFooter } from '@/components/PublicFooter'
import { BrandGlyph } from '@/components/BrandGlyph'
import { FlowPreview } from './FlowPreview'

type FeaturedArticle = {
  title: string | null
  url: string | null
  site_name: string | null
  excerpt: string | null
  score: number | null
  is_serendipity: boolean
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
  {
    slug: 'chercheur',
    label: { fr: 'Sport & Bien-être', en: 'Sport & Wellness' },
    description: {
      fr: 'Running, mental, nutrition, performance',
      en: 'Running, mindset, nutrition, performance',
    },
  },
  {
    slug: 'ml',
    label: { fr: 'Culture & Société', en: 'Culture & Society' },
    description: {
      fr: 'Cinéma, musique, littérature, idées',
      en: 'Cinema, music, literature, ideas',
    },
  },
]

const COPY = {
  fr: {
    taglineLead: 'Votre veille quotidienne,',
    taglineTail: 'sans le bruit.',
    body: "Chaque matin, Distil lit le web à votre place et ne garde que ce qui compte vraiment - filtré par vos centres d'intérêt, pas par un algorithme de popularité.",
    format: 'Une page à consulter chaque matin. Rien dans votre boîte mail.',
    cta: 'Commencer',
    loginNav: 'Connexion',
    howEyebrow: 'Chapitre I · La Méthode',
    howTitle: 'Comment ça marche',
    howSteps: [
      { n: '01', t: 'On capte', d: "Vos sources, vos centres d'intérêt, votre rythme." },
      {
        n: '02',
        t: 'On filtre',
        d: "Chaque matin, l'IA élimine le bruit en comparant chaque article à votre profil.",
      },
      {
        n: '03',
        t: 'On sert',
        d: 'Une page propre, lisible, sans notification ni scroll infini.',
      },
    ],
    examplesEyebrow: 'Chapitre II · Démonstration',
    examplesTitle: 'Exemples de veille',
    examplesSubtitle: "Choisissez un thème pour voir à quoi ressemble votre sélection d'aujourd'hui.",
    feedEyebrow: 'Chapitre III · Aperçu',
    feedTitle: 'Dans le flux ce matin',
    feedSub: 'Extrait de veilles actives',
    feedEmpty: 'Distil analyse le web en ce moment. Revenez dans quelques minutes.',
    serendipity: 'Découverte',
    relevance: 'Pertinence',
    noTitle: 'Sans titre',
  },
  en: {
    taglineLead: 'Your daily briefing,',
    taglineTail: 'without the noise.',
    body: 'Every morning, Distil reads the web for you and keeps only what truly matters - filtered by your interests, not by a popularity algorithm.',
    format: 'One page to check each morning. Nothing in your inbox.',
    cta: 'Get started',
    loginNav: 'Sign in',
    howEyebrow: 'Chapter I · The Method',
    howTitle: 'How it works',
    howSteps: [
      { n: '01', t: 'We capture', d: 'Your sources, your interests, your rhythm.' },
      {
        n: '02',
        t: 'We filter',
        d: 'Each morning, the AI removes the noise by comparing every article to your profile.',
      },
      {
        n: '03',
        t: 'We serve',
        d: 'A clean, readable page. No notifications, no infinite scroll.',
      },
    ],
    examplesEyebrow: 'Chapter II · Demonstration',
    examplesTitle: 'Feed examples',
    examplesSubtitle: "Pick a topic to preview today's selection.",
    feedEyebrow: 'Chapter III · Preview',
    feedTitle: 'In the feed this morning',
    feedSub: 'From active feeds',
    feedEmpty: 'Distil is scanning the web right now. Check back in a few minutes.',
    serendipity: 'Discovery',
    relevance: 'Relevance',
    noTitle: 'No title',
  },
}

function ArticlePreview({ article, lang }: { article: FeaturedArticle; lang: 'fr' | 'en' }) {
  const t = COPY[lang]
  const inner = (
    <div className="space-y-2">
      {article.site_name && (
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {article.site_name}
        </p>
      )}
      <h3 className="font-display text-[22px] leading-[1.15] text-foreground group-hover:text-accent transition-colors">
        {article.title ?? t.noTitle}
      </h3>
      {article.excerpt && (
        <p className="font-body text-[15px] text-muted-foreground line-clamp-2 leading-[1.55]">
          {article.excerpt}
        </p>
      )}
      {article.score !== null && (
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground pt-1">
          {article.is_serendipity && <span className="text-accent mr-2">{t.serendipity}</span>}
          {t.relevance}{' '}
          <span className="tabular-nums text-foreground">{Math.round(article.score)}</span>
        </p>
      )}
    </div>
  )

  return (
    <li className="py-6 border-b border-border last:border-0">
      {article.url ? (
        <a href={article.url} target="_blank" rel="noopener noreferrer" className="group block">
          {inner}
        </a>
      ) : (
        <div>{inner}</div>
      )}
    </li>
  )
}

export function StartScreen({ articles }: { articles: FeaturedArticle[] }) {
  const [lang, setLang] = useState<'fr' | 'en'>('fr')
  const t = COPY[lang]

  const today = new Date().toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const issueNumber = Math.max(
    1,
    Math.floor(
      (Date.now() - new Date('2026-01-01T00:00:00Z').getTime()) / (1000 * 60 * 60 * 24),
    ),
  )
    .toString()
    .padStart(3, '0')

  return (
    <main className="min-h-full flex flex-col px-5 md:px-8 py-5 md:py-10 bg-background">
      <div className="w-full max-w-2xl lg:max-w-5xl xl:max-w-6xl mx-auto flex-1">
        {/* Masthead editorial */}
        <header
          data-rise
          style={{ ['--rise-delay' as string]: '0' }}
          className="border-t-2 border-foreground pt-3 mb-12 md:mb-20"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-baseline gap-3 md:gap-5 min-w-0">
              <span className="flex items-baseline gap-1.5 md:gap-2 text-accent">
                <BrandGlyph size={20} className="self-center shrink-0" />
                <span className="font-display text-2xl md:text-3xl leading-none italic">
                  Distil
                </span>
              </span>
              <span className="hidden sm:inline text-border" aria-hidden="true">
                |
              </span>
              <span className="hidden sm:inline font-mono text-[11px] tracking-wider uppercase text-muted-foreground truncate">
                No {issueNumber} · {today}
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Link
                href="/login"
                className="font-mono text-[11px] uppercase tracking-wider px-2 py-0.5 text-muted-foreground hover:text-accent transition-colors"
              >
                {t.loginNav}
              </Link>
              <span className="text-border" aria-hidden="true">
                |
              </span>
              <button
                onClick={() => setLang('fr')}
                aria-pressed={lang === 'fr'}
                aria-label="Français"
                className={`font-mono text-[11px] uppercase tracking-wider px-2 py-0.5 transition-colors ${lang === 'fr' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                FR
              </button>
              <span className="text-border" aria-hidden="true">
                ·
              </span>
              <button
                onClick={() => setLang('en')}
                aria-pressed={lang === 'en'}
                aria-label="English"
                className={`font-mono text-[11px] uppercase tracking-wider px-2 py-0.5 transition-colors ${lang === 'en' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                EN
              </button>
              <span className="text-border" aria-hidden="true">
                |
              </span>
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Hero : 1 col mobile, 2 cols lg+ (copy a gauche, flux live a droite) */}
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)] lg:gap-16 xl:gap-24 lg:items-start mb-14 md:mb-20">
          <div className="space-y-8 md:space-y-10">
            <h1
              data-rise
              style={{ ['--rise-delay' as string]: '1' }}
              className="font-display text-foreground text-[3.5rem] sm:text-7xl md:text-8xl lg:text-[7.5rem] xl:text-[8.5rem] leading-[0.92] tracking-[-0.02em] text-balance"
            >
              {t.taglineLead}{' '}
              <em className="not-italic">
                <span className="italic text-accent whitespace-nowrap">{t.taglineTail}</span>
              </em>
            </h1>
            <p
              data-rise
              style={{ ['--rise-delay' as string]: '2' }}
              className="font-body text-lg md:text-xl text-muted-foreground leading-[1.55] max-w-[44ch] text-pretty"
            >
              {t.body}
            </p>
            <p
              data-rise
              style={{ ['--rise-delay' as string]: '3' }}
              className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground"
            >
              {t.format}
            </p>
            <div data-rise style={{ ['--rise-delay' as string]: '4' }} className="pt-2">
              <Link
                href="/login"
                className="group inline-flex items-center gap-3 font-ui text-[15px] border-b-2 border-foreground pb-1 text-foreground hover:text-accent hover:border-accent transition-colors"
              >
                {t.cta}
                <span
                  className="font-mono transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                >
                  →
                </span>
              </Link>
            </div>
          </div>
          <aside
            data-rise
            style={{ ['--rise-delay' as string]: '5' }}
            className="hidden lg:block mt-0"
          >
            <FlowPreview articles={articles} lang={lang} />
          </aside>
        </div>

        {/* Chapitre I : La Methode */}
        <section className="mb-20 md:mb-28">
          <div className="relative border-t border-border pt-8 md:pt-10 mb-10 md:mb-14">
            <span
              aria-hidden
              className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-accent inline-flex"
            >
              <BrandGlyph size={14} />
            </span>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-5">
              {t.howEyebrow}
            </p>
            <h2 className="font-display text-5xl md:text-7xl text-foreground leading-[0.95] tracking-[-0.01em] text-balance">
              {t.howTitle}
            </h2>
          </div>
          <ol className="grid gap-12 md:gap-0 md:grid-cols-3">
            {t.howSteps.map((step, i) => (
              <li
                key={step.n}
                className={`relative space-y-4 md:px-8 first:md:pl-0 last:md:pr-0 ${i > 0 ? 'md:border-l md:border-border' : ''}`}
              >
                <p className="font-mono text-[13px] tabular-nums text-accent tracking-[0.15em]">
                  {step.n}
                </p>
                <h3 className="font-display text-3xl md:text-4xl text-foreground leading-[1.05] tracking-[-0.01em]">
                  {step.t}
                </h3>
                <p className="font-body text-[16px] md:text-[17px] text-muted-foreground leading-[1.55] max-w-[32ch] text-pretty">
                  {step.d}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* Chapitre II : Demonstration */}
        <section className="mb-20 md:mb-28">
          <div className="relative border-t border-border pt-8 md:pt-10 mb-10 md:mb-14">
            <span
              aria-hidden
              className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-accent inline-flex"
            >
              <BrandGlyph size={14} />
            </span>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-5">
              {t.examplesEyebrow}
            </p>
            <h2 className="font-display text-5xl md:text-7xl text-foreground leading-[0.95] tracking-[-0.01em] mb-6 text-balance">
              {t.examplesTitle}
            </h2>
            <p className="font-body text-[17px] md:text-lg text-muted-foreground leading-[1.55] max-w-[48ch] text-pretty">
              {t.examplesSubtitle}
            </p>
          </div>
          <ul className="divide-y divide-border border-t border-b border-border">
            {PERSONA_EXAMPLES.map((p, i) => (
              <li key={p.slug}>
                <Link
                  href={`/demo/${p.slug}`}
                  className="group flex items-baseline gap-6 md:gap-10 py-5 md:py-6 hover:bg-card/60 transition-colors"
                >
                  <span className="font-mono text-[12px] tabular-nums text-accent tracking-[0.15em] shrink-0 w-10 md:w-14">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="flex-1 flex flex-col md:flex-row md:items-baseline md:gap-8 gap-1 min-w-0">
                    <span className="font-display text-2xl md:text-3xl text-foreground leading-tight group-hover:text-accent transition-colors md:w-60 shrink-0">
                      {p.label[lang]}
                    </span>
                    <span className="font-body text-[14px] md:text-[15px] text-muted-foreground leading-snug flex-1">
                      {p.description[lang]}
                    </span>
                  </span>
                  <span
                    className="font-mono text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all shrink-0"
                    aria-hidden="true"
                  >
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Chapitre III : Apercu (mobile seulement ; desktop l'a deja dans le hero) */}
        <section className="lg:hidden mb-8">
          <div className="relative border-t border-border pt-8 mb-8">
            <span
              aria-hidden
              className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-accent inline-flex"
            >
              <BrandGlyph size={14} />
            </span>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-5">
              {t.feedEyebrow}
            </p>
            <h2 className="font-display text-4xl md:text-5xl text-foreground leading-[0.95] tracking-[-0.01em] text-balance">
              {t.feedTitle}
            </h2>
          </div>
          {articles.length > 0 ? (
            <ul>
              {articles.map((article, i) => (
                <ArticlePreview key={article.url ?? String(i)} article={article} lang={lang} />
              ))}
            </ul>
          ) : (
            <p className="font-body text-[15px] text-muted-foreground italic py-4">
              {t.feedEmpty}
            </p>
          )}
        </section>
      </div>
      <PublicFooter lang={lang} />
    </main>
  )
}
