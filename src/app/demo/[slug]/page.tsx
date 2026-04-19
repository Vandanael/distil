export const revalidate = 3600

import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Masthead } from '@/components/Masthead'
import { scoreColorClass } from '@/lib/utils'
import { DEMO_ACCOUNTS, getDemoAccountBySlug } from '@/lib/demo-accounts'

export function generateStaticParams() {
  return DEMO_ACCOUNTS.map((a) => ({ slug: a.slug }))
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
      <div className="flex items-center gap-1.5 mb-1.5 text-[14px] text-subtle">
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
          className={`font-ui text-[20px] font-bold leading-[1.25] group-hover:text-accent transition-colors duration-150 ${
            isRejected
              ? 'line-through decoration-muted-foreground/40 text-muted-foreground'
              : 'text-foreground'
          }`}
        >
          {article.title ?? 'Sans titre'}
        </h2>
        {article.excerpt && !isRejected && (
          <p className="font-body text-[15px] text-subtle line-clamp-2 leading-[1.55] mt-1.5">
            {article.excerpt}
          </p>
        )}
      </div>

      {/* Score - identique a ArticleCard */}
      {article.score !== null && (
        <div className="flex items-center gap-3 mt-2">
          {article.is_serendipity && (
            <span className="font-ui text-[15px] text-accent">Découverte</span>
          )}
          <span
            className="font-ui text-[15px] text-subtle"
            title={article.justification ?? undefined}
          >
            Pertinence{' '}
            <span className={`font-semibold tabular-nums ${scoreColorClass(article.score)}`}>
              {Math.round(article.score)}%
            </span>
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
  const persona = getDemoAccountBySlug(slug)
  if (!persona) notFound()

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  let articles: Article[] = []

  if (serviceKey && supabaseUrl) {
    const sb = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data } = await sb
      .from('articles')
      .select(
        'id, title, site_name, excerpt, url, reading_time_minutes, score, justification, is_serendipity, status'
      )
      .eq('user_id', persona.id)
      .order('score', { ascending: false })
      .limit(20)

    articles = data ?? []
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
      <div className="max-w-2xl mx-auto px-4 py-5 md:py-10 w-full">
        <div className="mb-8">
          <Masthead
            brandHref="/"
            date={today}
            dateSuffix="· Démo lecture seule"
            rightSlot={
              <>
                <Link
                  href="/"
                  className="inline-flex items-center h-full font-ui text-[15px] px-2 text-subtle hover:text-accent transition-colors"
                >
                  Accueil
                </Link>
                <span className="text-border text-[14px] leading-none" aria-hidden="true">
                  |
                </span>
                <ThemeToggle />
              </>
            }
          />
          <p className="mt-4 font-ui text-[15px] text-foreground">
            Exemple de veille
            <span className="text-subtle"> - {persona.label.fr}</span>
          </p>
        </div>

        {/* Autres thèmes */}
        <div className="flex flex-wrap gap-2 mb-8">
          {DEMO_ACCOUNTS.filter((a) => a.slug !== slug).map((a) => (
            <Link
              key={a.slug}
              href={`/demo/${a.slug}`}
              className="font-ui text-[15px] text-subtle border border-border px-3 py-1.5 hover:border-accent hover:text-foreground transition-colors"
            >
              {a.label.fr}
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
          <p className="font-ui text-[15px] text-foreground">
            Votre veille ressemblerait à ça - configurée sur vos sujets à vous.
          </p>
          <Link
            href="/login"
            className="inline-block font-ui text-sm bg-foreground text-background px-6 py-3 hover:bg-accent hover:text-background transition-colors"
          >
            Créer mon profil
          </Link>
        </div>
      </div>
    </div>
  )
}
