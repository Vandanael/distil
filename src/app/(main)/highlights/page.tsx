import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

type Highlight = {
  id: string
  text_content: string
  created_at: string
  article: {
    id: string
    title: string | null
    site_name: string | null
  } | null
}

export default async function HighlightsPage() {
  let highlights: Highlight[] = []

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { data } = await supabase
        .from('highlights')
        .select('id, text_content, created_at, articles(id, title, site_name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(200)

      highlights =
        (data ?? []).map((h) => ({
          id: h.id,
          text_content: h.text_content,
          created_at: h.created_at,
          article: Array.isArray(h.articles) ? (h.articles[0] ?? null) : h.articles,
        })) ?? []
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:py-12 space-y-10 w-full">
      <div className="space-y-4 border-b border-border pb-8">
        <h1 className="font-ui text-3xl font-bold leading-tight text-foreground">Highlights</h1>
        <span className="font-ui text-sm text-muted-foreground">
          {highlights.length} passage{highlights.length !== 1 ? 's' : ''} surligne
          {highlights.length !== 1 ? 's' : ''}
        </span>
      </div>

      {highlights.length === 0 ? (
        <div className="space-y-3 py-8">
          <p className="font-ui text-sm text-muted-foreground">
            Aucun highlight pour l&apos;instant.
          </p>
          <p className="font-body text-sm text-muted-foreground">
            Selectionnez du texte pendant la lecture pour surligner un passage.
          </p>
          <Link href="/feed" className="font-ui text-sm text-accent hover:underline">
            &larr; Retour au feed
          </Link>
        </div>
      ) : (
        <div className="space-y-8" data-testid="highlights-list">
          {highlights.map((h) => (
            <div key={h.id} className="space-y-2 border-b border-border pb-8 last:border-0">
              <blockquote className="border-l-2 border-accent pl-4 font-body text-sm text-foreground leading-relaxed italic">
                {h.text_content}
              </blockquote>
              {h.article && (
                <Link
                  href={`/article/${h.article.id}`}
                  className="font-ui text-[13px] text-muted-foreground hover:text-accent transition-colors"
                >
                  {h.article.site_name ?? h.article.title ?? 'Article'} &rarr;
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
