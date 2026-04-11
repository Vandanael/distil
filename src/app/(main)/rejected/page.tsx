import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { RejectedCard } from './RejectedCard'

export default async function RejectedPage() {
  let articles: Array<{
    id: string
    title: string | null
    site_name: string | null
    rejection_reason: string | null
    score: number | null
    url: string
  }> = []

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { data } = await supabase
        .from('articles')
        .select('id, title, site_name, rejection_reason, score, url')
        .eq('user_id', user.id)
        .eq('status', 'rejected')
        .order('scored_at', { ascending: false })
        .limit(100)

      articles = data ?? []
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:py-12 space-y-10 w-full">
        {/* En-tete */}
        <div className="space-y-4 border-b border-border pb-8">
          <Link
            href="/feed"
            className="font-ui text-sm text-muted-foreground transition-colors hover:text-accent"
            data-testid="back-to-feed"
          >
            &larr; Feed
          </Link>
          <p className="font-ui text-[10px] uppercase tracking-widest text-accent">Filtres</p>
          <h1 className="font-ui text-4xl font-semibold text-foreground">
            Articles rejet&eacute;s
          </h1>
          <p className="font-body text-sm text-muted-foreground">
            {articles.length} article{articles.length !== 1 ? 's' : ''} filtr
            {articles.length !== 1 ? 'és' : 'é'} par l&apos;agent.
          </p>
        </div>

        {/* Liste */}
        <div className="space-y-6" data-testid="rejected-articles">
          {articles.length === 0 ? (
            <p className="font-ui text-sm text-muted-foreground py-8">
              Aucun article rejet&eacute; pour l&apos;instant.
            </p>
          ) : (
            articles.map((a) => (
              <RejectedCard
                key={a.id}
                id={a.id}
                title={a.title}
                siteName={a.site_name}
                rejectionReason={a.rejection_reason}
                score={a.score}
                url={a.url}
              />
            ))
          )}
        </div>
    </div>
  )
}
