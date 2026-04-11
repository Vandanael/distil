import Link from 'next/link'

type FeaturedArticle = {
  title: string | null
  site_name: string | null
  excerpt: string | null
  score: number | null
  is_serendipity: boolean
}

function MiniScoreBar({ score }: { score: number }) {
  const color = score >= 70 ? 'bg-emerald-500' : score >= 40 ? 'bg-amber-400' : 'bg-red-400'
  return (
    <div className="h-1 w-10 bg-border overflow-hidden shrink-0" title={`Score ${score}/100`}>
      <div className={`h-full ${color}`} style={{ width: `${score}%` }} />
    </div>
  )
}

function ArticlePreview({ article }: { article: FeaturedArticle }) {
  return (
    <div className="space-y-2 border-b border-border pb-6 last:border-0">
      <div className="flex items-start justify-between gap-4">
        <p className="font-ui text-sm font-semibold text-foreground leading-snug">
          {article.title ?? 'Sans titre'}
        </p>
        {article.score !== null && <MiniScoreBar score={article.score} />}
      </div>
      <div className="flex items-center gap-3">
        {article.site_name && (
          <span className="font-ui text-[11px] uppercase tracking-wider text-muted-foreground">
            {article.site_name}
          </span>
        )}
        {article.is_serendipity && (
          <span className="font-ui text-[11px] uppercase tracking-wider text-accent">
            Decouverte
          </span>
        )}
      </div>
      {article.excerpt && (
        <p className="font-body text-xs text-muted-foreground line-clamp-2">{article.excerpt}</p>
      )}
    </div>
  )
}

export function StartScreen({ articles }: { articles: FeaturedArticle[] }) {
  return (
    <main className="min-h-full flex flex-col items-center justify-center px-4 py-16 bg-background">
      <div className="w-full max-w-sm space-y-12">
        {/* Masthead */}
        <div className="space-y-5">
          <div className="space-y-4">
            <h1 className="font-logo text-5xl md:text-7xl uppercase tracking-tight text-foreground">
              Distil
            </h1>
            <div className="h-0.5 w-10 bg-accent" />
          </div>
          <p className="font-body text-lg leading-relaxed text-muted-foreground">
            Votre veille du matin. Triee par ce qui compte vraiment.
          </p>
          <p className="font-body text-sm text-muted-foreground/70">
            Chaque jour, Distil lit le web pour vous et ne garde que l&apos;essentiel.
          </p>
        </div>

        {/* Articles du dernier cron */}
        {articles.length > 0 && (
          <div className="space-y-4">
            <p className="font-ui text-[10px] uppercase tracking-widest text-muted-foreground/60">
              Articles selectionnes ce matin
            </p>
            <div className="space-y-6">
              {articles.map((article, i) => (
                <ArticlePreview key={i} article={article} />
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="space-y-3">
          <Link
            href="/login"
            className="block w-full text-center font-ui text-sm bg-foreground text-background px-4 py-3 hover:bg-accent hover:text-background transition-colors"
          >
            Commencer — c&apos;est gratuit
          </Link>
          <p className="font-ui text-xs text-center text-muted-foreground/60">
            Pas de newsletter, pas de spam. Un lien magique suffit.
          </p>
        </div>
      </div>
    </main>
  )
}
