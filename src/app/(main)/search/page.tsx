import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { searchFullText, searchSemantic } from '@/lib/search/search'
import { SearchBar } from './SearchBar'
import { SearchResults } from './SearchResults'

type Props = {
  searchParams: Promise<{ q?: string; mode?: string }>
}

export default async function SearchPage({ searchParams }: Props) {
  const { q: query = '', mode = 'fulltext' } = await searchParams

  // Bypass auth ou Supabase non configure
  if (
    process.env.DEV_BYPASS_AUTH === 'true' ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return <SearchShell query={query} results={[]} />
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const results = query.trim()
    ? mode === 'semantic'
      ? await searchSemantic(user.id, query)
      : await searchFullText(user.id, query)
    : []

  return <SearchShell query={query} results={results} />
}

function SearchShell({
  query,
  results,
}: {
  query: string
  results: Awaited<ReturnType<typeof searchFullText>>
}) {
  return (
    <main className="max-w-2xl mx-auto px-4 py-10 space-y-8">
      <h1 className="font-display text-2xl text-foreground">Rechercher</h1>

      <Suspense>
        <SearchBar />
      </Suspense>

      {query.trim() ? (
        <SearchResults results={results} query={query} />
      ) : (
        <p className="font-body text-sm text-muted-foreground">
          Commencez a taper pour chercher dans votre veille.
        </p>
      )}
    </main>
  )
}
