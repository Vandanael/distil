import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArchiveList } from '../archive/ArchiveList'
import { RejectedCard } from '../rejected/RejectedCard'
import { LibraryTabs, type LibraryTab } from './LibraryTabs'

type Props = {
  searchParams: Promise<{ tab?: string }>
}

function parseTab(raw: string | undefined): LibraryTab {
  if (raw === 'highlights' || raw === 'filtered') return raw
  return 'saved'
}

type SavedArticle = {
  id: string
  title: string | null
  site_name: string | null
  url: string
  reading_time_minutes: number | null
  archived_at: string | null
  score: number | null
}

type Highlight = {
  id: string
  text_content: string
  created_at: string
  article: { id: string; title: string | null; site_name: string | null } | null
}

type FilteredArticle = {
  id: string
  title: string | null
  site_name: string | null
  rejection_reason: string | null
  score: number | null
  url: string
}

export default async function LibraryPage({ searchParams }: Props) {
  const { tab: rawTab } = await searchParams
  const tab = parseTab(rawTab)

  let saved: SavedArticle[] = []
  let highlights: Highlight[] = []
  let filtered: FilteredArticle[] = []
  let hasNotes = false

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      if (tab === 'saved') {
        const { data } = await supabase
          .from('articles')
          .select('id, title, site_name, url, reading_time_minutes, archived_at, score')
          .eq('user_id', user.id)
          .eq('status', 'archived')
          .order('archived_at', { ascending: false })
          .limit(200)
        saved = data ?? []

        const { count } = await supabase
          .from('notes')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
        hasNotes = (count ?? 0) > 0
      } else if (tab === 'highlights') {
        const { data } = await supabase
          .from('highlights')
          .select('id, text_content, created_at, articles(id, title, site_name)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(200)
        highlights = (data ?? []).map((h) => ({
          id: h.id,
          text_content: h.text_content,
          created_at: h.created_at,
          article: Array.isArray(h.articles) ? (h.articles[0] ?? null) : h.articles,
        }))
      } else {
        const { data } = await supabase
          .from('articles')
          .select('id, title, site_name, rejection_reason, score, url')
          .eq('user_id', user.id)
          .eq('status', 'rejected')
          .order('scored_at', { ascending: false })
          .limit(100)
        filtered = data ?? []
      }
    }
  }

  const count =
    tab === 'saved' ? saved.length : tab === 'highlights' ? highlights.length : filtered.length

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:py-12 space-y-8 w-full">
      <div className="space-y-4">
        <h1 className="font-ui text-3xl font-bold leading-tight text-foreground">Bibliotheque</h1>
        <LibraryTabs active={tab} />
      </div>

      <div className="flex items-center gap-6">
        <span className="font-ui text-sm text-muted-foreground" data-testid="library-count">
          {count} {tab === 'highlights' ? 'passage' : 'article'}
          {count !== 1 ? 's' : ''}
        </span>
        {tab === 'saved' && hasNotes && (
          <a
            href="/api/export/notes"
            download
            className="font-ui text-sm text-muted-foreground transition-colors hover:text-accent"
            data-testid="export-notes-link"
          >
            Exporter les notes &darr;
          </a>
        )}
      </div>

      {tab === 'saved' && <ArchiveList articles={saved} />}

      {tab === 'highlights' && (
        <>
          {highlights.length === 0 ? (
            <div className="space-y-3 py-8">
              <p className="font-ui text-sm text-muted-foreground">
                Aucun highlight pour l&apos;instant.
              </p>
              <p className="font-body text-sm text-muted-foreground">
                Selectionnez du texte pendant la lecture pour surligner un passage.
              </p>
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
        </>
      )}

      {tab === 'filtered' && (
        <div className="space-y-6" data-testid="rejected-articles">
          {filtered.length === 0 ? (
            <p className="font-ui text-sm text-muted-foreground py-8">
              Aucun article filtre pour l&apos;instant.
            </p>
          ) : (
            filtered.map((a) => (
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
      )}
    </div>
  )
}
