'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ThemeToggle } from '@/components/ThemeToggle'
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
    tagline: 'Votre veille quotidienne, sans le bruit.',
    body: "Chaque matin, Distil lit le web à votre place et ne garde que ce qui compte vraiment - filtré par vos centres d'intérêt, pas par un algorithme de popularité.",
    format: 'Une page à consulter chaque matin. Rien dans votre boîte mail.',
    cta: "Commencer - c'est gratuit",
    examplesTitle: 'Exemples de veille',
    examplesSubtitle: 'Cliquez sur un thème pour voir à quoi ressemble votre sélection du jour.',
    feedTitle: 'Dans le flux ce matin',
    feedSub: 'Extrait de veilles actives',
    feedEmpty: 'Distil analyse le web en ce moment. Revenez dans quelques minutes.',
    serendipity: 'Découverte',
    relevance: 'Pertinence',
    noTitle: 'Sans titre',
  },
  en: {
    tagline: 'Your daily briefing, without the noise.',
    body: 'Every morning, Distil reads the web for you and keeps only what truly matters - filtered by your interests, not by a popularity algorithm.',
    format: 'One page to check each morning. Nothing in your inbox.',
    cta: "Get started - it's free",
    examplesTitle: 'Feed examples',
    examplesSubtitle: 'Click a topic to see what your daily selection looks like.',
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
    <div>
      {article.site_name && (
        <div className="mb-1.5">
          <span className="font-ui text-[13px] text-muted-foreground">{article.site_name}</span>
        </div>
      )}
      <h3 className="font-ui text-xl font-bold leading-snug text-foreground group-hover:text-accent transition-colors duration-150">
        {article.title ?? t.noTitle}
      </h3>
      {article.excerpt && (
        <p className="font-body text-[15px] text-muted-foreground line-clamp-2 leading-relaxed mt-1">
          {article.excerpt}
        </p>
      )}
      {article.score !== null && (
        <p className="font-ui text-[13px] text-muted-foreground mt-2">
          {article.is_serendipity && <span className="text-accent mr-2">{t.serendipity}</span>}
          {t.relevance}{' '}
          <span className="font-semibold tabular-nums">{Math.round(article.score)}%</span>
        </p>
      )}
    </div>
  )

  return (
    <div className="py-5 border-b border-border last:border-0">
      {article.url ? (
        <a href={article.url} target="_blank" rel="noopener noreferrer" className="group block">
          {inner}
        </a>
      ) : (
        <div>{inner}</div>
      )}
    </div>
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

  return (
    <main className="min-h-full flex flex-col items-center justify-center px-4 py-6 md:py-16 bg-background">
      <div className="w-full max-w-2xl lg:max-w-5xl xl:max-w-6xl">
        {/* Bandeau éditorial */}
        <div className="border-t-2 border-foreground mb-8 pt-3 flex items-center justify-between">
          <span className="font-ui text-xs text-muted-foreground capitalize">{today}</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setLang('fr')}
              aria-pressed={lang === 'fr'}
              aria-label="Français"
              className={`font-ui text-xs px-2 py-0.5 transition-colors ${lang === 'fr' ? 'text-foreground font-semibold' : 'text-muted-foreground/50 hover:text-muted-foreground'}`}
            >
              FR
            </button>
            <span className="text-muted-foreground/30 text-xs" aria-hidden="true">
              |
            </span>
            <button
              onClick={() => setLang('en')}
              aria-pressed={lang === 'en'}
              aria-label="English"
              className={`font-ui text-xs px-2 py-0.5 transition-colors ${lang === 'en' ? 'text-foreground font-semibold' : 'text-muted-foreground/50 hover:text-muted-foreground'}`}
            >
              EN
            </button>
            <span className="text-muted-foreground/30 text-xs" aria-hidden="true">
              |
            </span>
            <ThemeToggle />
          </div>
        </div>

        {/* Hero : 1 col mobile, 2 cols lg+ (copy a gauche, flux live a droite) */}
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:gap-14 lg:items-start mb-14">
          <div className="space-y-6">
            <h1 className="font-ui text-4xl md:text-5xl font-bold tracking-tight text-accent leading-none">
              Distil
            </h1>
            <p className="font-ui text-3xl md:text-5xl lg:text-6xl font-bold text-foreground leading-[1.05] tracking-tight">
              {t.tagline}
            </p>
            <p className="font-body text-lg md:text-xl text-muted-foreground leading-relaxed">
              {t.body}
            </p>
            <p className="font-ui text-sm text-muted-foreground/70">{t.format}</p>
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-flex font-ui text-sm bg-foreground text-background px-6 py-3 hover:bg-accent hover:text-background transition-colors"
              >
                {t.cta}
              </Link>
            </div>
          </div>
          <aside className="hidden lg:block mt-8 lg:mt-0">
            <FlowPreview articles={articles} lang={lang} />
          </aside>
        </div>

        {/* Exemples de veille */}
        <div className="mb-14">
          <div className="border-t border-border pt-6 mb-6">
            <p className="font-ui text-[13px] text-foreground font-medium">{t.examplesTitle}</p>
            <p className="font-body text-[13px] text-muted-foreground mt-0.5">
              {t.examplesSubtitle}
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {PERSONA_EXAMPLES.map((p) => (
              <Link
                key={p.slug}
                href={`/demo/${p.slug}`}
                className="group border border-border p-3 space-y-1 hover:border-accent/60 transition-colors block"
              >
                <p className="font-ui text-sm font-medium text-foreground leading-snug group-hover:text-accent transition-colors">
                  {p.label[lang]}
                </p>
                <p className="font-body text-xs text-muted-foreground leading-snug">
                  {p.description[lang]}
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* Apercu du flux (masque sur lg+ car deja visible dans FlowPreview du hero) */}
        <div className="lg:hidden">
          <div className="border-t-2 border-foreground pt-3 mb-0">
            <div className="flex items-baseline justify-between">
              <p className="font-ui text-[13px] text-foreground font-medium">{t.feedTitle}</p>
              {articles.length > 0 && (
                <p className="font-ui text-xs text-muted-foreground/60">{t.feedSub}</p>
              )}
            </div>
          </div>
          {articles.length > 0 ? (
            <div>
              {articles.map((article, i) => (
                <ArticlePreview key={article.url ?? String(i)} article={article} lang={lang} />
              ))}
            </div>
          ) : (
            <p className="font-body text-[13px] text-muted-foreground italic py-4">{t.feedEmpty}</p>
          )}
        </div>
      </div>
    </main>
  )
}
