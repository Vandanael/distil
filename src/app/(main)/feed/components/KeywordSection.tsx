type KeywordHit = {
  itemId: string
  url: string
  title: string | null
  siteName: string | null
  publishedAt: string | null
  wordCount: number | null
}

type KeywordGroup = {
  keyword: string
  hits: KeywordHit[]
}

type Props = {
  groups: KeywordGroup[]
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export function KeywordSection({ groups }: Props) {
  if (groups.length === 0) return null

  const totalHits = groups.reduce((sum, g) => sum + g.hits.length, 0)

  return (
    <section className="mt-10 border-t border-border pt-6 lg:max-w-[720px]">
      <header className="mb-4">
        <h2 className="font-ui text-lg font-semibold text-foreground">Tous vos mots-cles</h2>
        <p className="mt-1 font-ui text-sm text-muted-foreground">
          {totalHits} article{totalHits > 1 ? 's' : ''} des 48 dernieres heures qui matchent vos
          mots-cles et n&apos;apparaissent pas dans le feed ci-dessus.
        </p>
      </header>

      <div className="space-y-2">
        {groups.map((group) => (
          <details
            key={group.keyword}
            className="group border border-border bg-background"
            data-testid={`keyword-group-${group.keyword}`}
          >
            <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 font-ui text-sm font-semibold text-foreground hover:bg-muted/40 [&::-webkit-details-marker]:hidden">
              <span>
                {group.keyword}{' '}
                <span className="font-normal text-muted-foreground">({group.hits.length})</span>
              </span>
              <span
                aria-hidden="true"
                className="text-muted-foreground transition-transform group-open:rotate-90"
              >
                &rsaquo;
              </span>
            </summary>
            <ul className="divide-y divide-border border-t border-border">
              {group.hits.map((hit) => (
                <li key={hit.itemId}>
                  <a
                    href={hit.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-4 py-3 hover:bg-muted/40"
                  >
                    <div className="font-ui text-sm font-medium text-foreground">
                      {hit.title ?? hit.url}
                    </div>
                    <div className="mt-1 flex items-center gap-2 font-ui text-[13px] text-muted-foreground">
                      {hit.siteName && <span>{hit.siteName}</span>}
                      {hit.publishedAt && (
                        <>
                          <span aria-hidden="true">&middot;</span>
                          <span>{formatDate(hit.publishedAt)}</span>
                        </>
                      )}
                      {hit.wordCount ? (
                        <>
                          <span aria-hidden="true">&middot;</span>
                          <span>{hit.wordCount} mots</span>
                        </>
                      ) : null}
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </section>
  )
}

export type { KeywordHit, KeywordGroup }
