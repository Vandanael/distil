import { createClient } from '@/lib/supabase/server'
import { ArchiveList } from './ArchiveList'

export default async function ArchivePage() {
  let articles: Array<{
    id: string
    title: string | null
    site_name: string | null
    url: string
    reading_time_minutes: number | null
    archived_at: string | null
    score: number | null
  }> = []

  let hasNotes = false

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { data } = await supabase
        .from('articles')
        .select('id, title, site_name, url, reading_time_minutes, archived_at, score')
        .eq('user_id', user.id)
        .eq('status', 'archived')
        .order('archived_at', { ascending: false })
        .limit(200)

      articles = data ?? []

      const { count } = await supabase
        .from('notes')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)

      hasNotes = (count ?? 0) > 0
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:py-12 space-y-10 w-full">
      <div className="space-y-4 border-b border-border pb-8">
        <h1 className="font-ui text-3xl font-bold leading-tight text-foreground">Archives</h1>
        <div className="flex items-center gap-6">
          <span className="font-ui text-sm text-muted-foreground">
            {articles.length} article{articles.length !== 1 ? 's' : ''}
          </span>
          {hasNotes && (
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
      </div>

      <ArchiveList articles={articles} />
    </div>
  )
}
