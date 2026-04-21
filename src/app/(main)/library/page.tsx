import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { ArchiveList } from '../archive/ArchiveList'

type SavedArticle = {
  id: string
  title: string | null
  site_name: string | null
  url: string
  reading_time_minutes: number | null
  archived_at: string | null
  score: number | null
}

export default async function LibraryPage() {
  const cookieStore = await cookies()
  const locale = cookieStore.get('locale')?.value === 'en' ? 'en' : 'fr'
  const isFr = locale === 'fr'

  let saved: SavedArticle[] = []
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
        .eq('status', 'to_read')
        .order('archived_at', { ascending: false })
        .limit(200)
      saved = data ?? []

      const { count } = await supabase
        .from('notes')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
      hasNotes = (count ?? 0) > 0
    }
  }

  return (
    <div className="max-w-[720px] lg:max-w-[1160px] mx-auto px-4 py-8 md:py-12 space-y-8 w-full">
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <h1 className="font-ui text-3xl font-bold leading-tight text-foreground">
          {isFr ? 'À lire' : 'To read'}
        </h1>
        <span className="font-ui text-sm text-muted-foreground" data-testid="library-count">
          {isFr ? 'À lire' : 'To read'} ({saved.length})
        </span>
      </div>

      {hasNotes && (
        <a
          href="/api/export/notes"
          download
          className="inline-block font-ui text-sm text-muted-foreground transition-colors hover:text-accent"
          data-testid="export-notes-link"
        >
          Exporter les notes &darr;
        </a>
      )}

      <ArchiveList articles={saved} />
    </div>
  )
}
