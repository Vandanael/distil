'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'

type Mode = 'fulltext' | 'semantic'

export function SearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [mode, setMode] = useState<Mode>((searchParams.get('mode') as Mode) ?? 'fulltext')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    startTransition(() => {
      router.push(`/search?q=${encodeURIComponent(query.trim())}&mode=${mode}`)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-2">
        <input
          data-testid="search-input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Retrouver un article..."
          autoFocus
          className="flex-1 border border-input bg-transparent px-3 py-2 font-ui text-foreground transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 h-11 text-base"
        />
        <button
          type="submit"
          disabled={isPending || !query.trim()}
          className="shrink-0 border border-transparent bg-primary text-primary-foreground font-ui text-sm font-semibold px-4 h-11 transition-all disabled:opacity-40"
        >
          Chercher
        </button>
      </div>

      <div
        data-testid="mode-toggle"
        className="flex items-center gap-1 font-ui text-xs"
      >
        <button
          type="button"
          onClick={() => setMode('fulltext')}
          className={[
            'px-3 py-1 border transition-colors',
            mode === 'fulltext'
              ? 'border-foreground text-foreground bg-transparent'
              : 'border-border text-muted-foreground hover:border-foreground/50',
          ].join(' ')}
        >
          Full-text
        </button>
        <button
          type="button"
          onClick={() => setMode('semantic')}
          className={[
            'px-3 py-1 border transition-colors',
            mode === 'semantic'
              ? 'border-foreground text-foreground bg-transparent'
              : 'border-border text-muted-foreground hover:border-foreground/50',
          ].join(' ')}
        >
          Semantique
        </button>
      </div>
    </form>
  )
}
