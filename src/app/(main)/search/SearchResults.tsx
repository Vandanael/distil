import Link from 'next/link'
import type { SearchResult } from '@/lib/search/search'

type Props = {
  results: SearchResult[]
  query: string
}

export function SearchResults({ results, query }: Props) {
  if (results.length === 0) {
    return (
      <p className="font-body text-sm text-muted-foreground py-8 text-center">
        Aucun resultat pour <span className="text-foreground">&ldquo;{query}&rdquo;</span>
      </p>
    )
  }

  return (
    <ul className="space-y-0" data-testid="search-results">
      {results.map((result) => (
        <li key={result.id}>
          <Link
            href={`/article/${result.id}`}
            className="group block space-y-1.5 border-b border-border py-5 last:border-0"
            data-testid={`search-result-${result.id}`}
          >
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-ui text-base font-semibold text-foreground leading-snug group-hover:text-accent transition-colors">
                {result.title ?? 'Sans titre'}
              </h2>
              {result.matchType === 'semantic' && result.similarity !== undefined && (
                <span
                  className="shrink-0 font-ui text-xs tabular-nums text-accent"
                  data-testid={`similarity-badge-${result.id}`}
                >
                  {Math.round(result.similarity * 100)}%
                </span>
              )}
            </div>

            {result.site_name && (
              <span className="font-ui text-[13px] text-muted-foreground">{result.site_name}</span>
            )}

            {result.excerpt && (
              <p className="font-body text-sm text-muted-foreground line-clamp-2">
                {result.excerpt}
              </p>
            )}
          </Link>
        </li>
      ))}
    </ul>
  )
}
