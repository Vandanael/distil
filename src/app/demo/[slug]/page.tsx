import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ThemeToggle'

const PERSONAS: Record<string, { label: string; description: string; email: string }> = {
  pm: {
    label: 'Politique & Monde',
    description: 'Géopolitique, démocratie, actualité internationale',
    email: 'test-pm@distil.app',
  },
  consultant: {
    label: 'Cuisine & Gastronomie',
    description: 'Techniques, chefs, restaurants, recettes',
    email: 'test-consultant@distil.app',
  },
  dev: {
    label: 'Tech & Numérique',
    description: 'Actualité tech, outils, open source',
    email: 'test-dev@distil.app',
  },
  chercheur: {
    label: 'Sport & Bien-être',
    description: 'Running, mental, nutrition, performance',
    email: 'test-chercheur@distil.app',
  },
  ml: {
    label: 'Culture & Société',
    description: 'Cinéma, musique, littérature, idées',
    email: 'test-ml@distil.app',
  },
}

const SLUGS = Object.keys(PERSONAS)

export function generateStaticParams() {
  return SLUGS.map((slug) => ({ slug }))
}

type Article = {
  id: string
  title: string | null
  site_name: string | null
  excerpt: string | null
  url: string | null
  reading_time_minutes: number | null
  score: number | null
  justification: string | null
  is_serendipity: boolean
  status: string
}

function DemoArticleCard({ article, index }: { article: Article; index: number }) {
  const isRejected = article.status === 'rejected'
  // Reproduit exactement le layout d'ArticleCard du feed
  const isAboveFold = index < 3

  const cardContent = (
    <>
      {/* Meta : source · durée */}
      <div className="flex items-center gap-1.5 mb-1.5 text-[13px] text-muted-foreground">
        {article.site_name && <span className="font-ui">{article.site_name}</span>}
        {article.reading_time_minutes && (
          <>
            <span>·</span>
            <span className="font-ui">{article.reading_time_minutes} min</span>
          </>
        )}
        {isRejected && (
          <>
            <span>·</span>
            <span className="font-ui text-destructive/70">Rejeté par Distil</span>
          </>
        )}
      </div>

      {/* Titre + extrait */}
      <div>
        <h2
          className={`font-ui text-xl font-bold leading-snug group-hover:text-accent transition-colors duration-150 ${
            isRejected
              ? 'line-through decoration-muted-foreground/40 text-muted-foreground'
              : 'text-foreground'
          }`}
        >
          {article.title ?? 'Sans titre'}
        </h2>
        {article.excerpt && !isRejected && (
          <p className="font-body text-[15px] text-muted-foreground line-clamp-2 leading-relaxed mt-1">
            {article.excerpt}
          </p>
        )}
      </div>

      {/* Score - identique a ArticleCard */}
      {article.score !== null && (
        <div className="flex items-center gap-3 mt-2">
          {article.is_serendipity && (
            <span className="font-ui text-[13px] text-accent">Découverte</span>
          )}
          <span
            className="font-ui text-[13px] text-muted-foreground"
            title={article.justification ?? undefined}
          >
            Pertinence{' '}
            <span className="font-semibold tabular-nums">{Math.round(article.score)}%</span>
          </span>
        </div>
      )}
    </>
  )

  return (
    <div
      className={`group relative block py-5 -mx-3 px-3 transition-colors hover:bg-muted/40 ${
        isRejected ? 'opacity-40' : ''
      }`}
      data-testid={`demo-card-${article.id}`}
      // Pas d'animation cote serveur, on garde la coherence visuelle sans JS requis
    >
      {article.url && !isRejected ? (
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group block"
          tabIndex={isAboveFold ? 0 : undefined}
        >
          {cardContent}
        </a>
      ) : (
        <div>{cardContent}</div>
      )}
    </div>
  )
}

export default async function DemoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const persona = PERSONAS[slug]
  if (!persona) notFound()

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  let articles: Article[] = []

  if (serviceKey && supabaseUrl) {
    const sb = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Map email → ID stable (comptes créés par create-test-accounts.mjs)
    const EMAIL_TO_ID: Record<string, string> = {
      'test-pm@distil.app': '795c2637-7e43-4b74-82b1-560899cf62d7',
      'test-consultant@distil.app': '17e9ac27-5bc3-403c-94e4-cb2d6db1e38c',
      'test-dev@distil.app': 'a615fba9-490a-4dd9-a161-45f8c9b54943',
      'test-chercheur@distil.app': 'e970bbf3-eb89-476a-bf68-250f53f6ec13',
      'test-ml@distil.app': 'ce745cc5-266e-4293-a677-2cad575f1aef',
    }
    const userId = EMAIL_TO_ID[persona.email]
    const user = userId ? { id: userId } : null

    if (user) {
      const { data } = await sb
        .from('articles')
        .select(
          'id, title, site_name, excerpt, url, reading_time_minutes, score, justification, is_serendipity, status'
        )
        .eq('user_id', user.id)
        .order('score', { ascending: false })
        .limit(20)

      articles = data ?? []
    }
  }

  const accepted = articles.filter((a) => a.status === 'accepted')
  const rejected = articles.filter((a) => a.status === 'rejected')
  const all = [...accepted, ...rejected]

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="min-h-full bg-background">
      <div className="max-w-2xl mx-auto px-4 py-6 md:py-10 w-full">
        {/* En-tete - identique au vrai feed */}
        <div className="border-t-2 border-foreground mb-8 pt-3 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-ui text-xs text-muted-foreground capitalize">{today}</span>
            <span className="font-ui text-xs text-accent">Démo lecture seule</span>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <p className="font-ui text-[13px] text-foreground">
              Exemple de veille
              <span className="text-muted-foreground"> - {persona.label}</span>
            </p>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link
                href="/"
                className="font-ui text-xs text-muted-foreground/60 hover:text-accent transition-colors shrink-0"
              >
                ← Accueil
              </Link>
            </div>
          </div>
        </div>

        {/* Autres thèmes */}
        <div className="flex flex-wrap gap-2 mb-8">
          {SLUGS.filter((s) => s !== slug).map((s) => (
            <Link
              key={s}
              href={`/demo/${s}`}
              className="font-ui text-xs text-muted-foreground border border-border px-3 py-1.5 hover:border-accent/60 hover:text-foreground transition-colors"
            >
              {PERSONAS[s].label}
            </Link>
          ))}
        </div>

        {/* Articles - meme espacement que le feed */}
        <div className="space-y-8" data-testid="demo-articles">
          {all.length === 0 ? (
            <p className="font-body text-sm text-muted-foreground py-12">
              Aucun article pour cette démo.
            </p>
          ) : (
            all.map((article, i) => (
              <DemoArticleCard key={article.id} article={article} index={i} />
            ))
          )}
        </div>

        {/* CTA */}
        <div className="border-t border-border mt-10 pt-8 space-y-4">
          <p className="font-ui text-[13px] text-foreground">
            Votre veille ressemblerait à ça - configurée sur vos sujets à vous.
          </p>
          <Link
            href="/login"
            className="inline-block font-ui text-sm bg-foreground text-background px-6 py-3 hover:bg-accent hover:text-background transition-colors"
          >
            Créer mon profil - c&apos;est gratuit
          </Link>
        </div>
      </div>
    </div>
  )
}
