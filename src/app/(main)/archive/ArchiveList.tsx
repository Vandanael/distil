'use client'

import Link from 'next/link'

type Article = {
  id: string
  title: string | null
  site_name: string | null
  url: string
  reading_time_minutes: number | null
  archived_at: string | null
  score: number | null
}

function formatArchivedDate(iso: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  const diffD = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
  if (diffD === 0) return "aujourd'hui"
  if (diffD === 1) return 'hier'
  if (diffD < 7) return `il y a ${diffD}j`
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

type Props = { articles: Article[] }

export function ArchiveList({ articles }: Props) {
  if (articles.length === 0) {
    return (
      <div className="space-y-3 py-8">
        <p className="font-ui text-sm text-muted-foreground">
          Aucun article archive pour l&apos;instant.
        </p>
        <p className="font-body text-sm text-muted-foreground">
          Archivez un article depuis la vue lecture pour le retrouver ici.
        </p>
        <Link href="/feed" className="font-ui text-sm text-accent hover:underline">
          &larr; Retour au feed
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6" data-testid="archive-list">
      {articles.map((a) => (
        <Link
          key={a.id}
          href={`/article/${a.id}`}
          className="group block space-y-2 border-b border-border pb-6 last:border-0"
          data-testid={`archive-card-${a.id}`}
        >
          <h2 className="font-ui text-base font-semibold text-foreground leading-snug group-hover:text-accent transition-colors">
            {a.title ?? 'Sans titre'}
          </h2>
          <div className="flex items-center gap-3">
            {a.site_name && (
              <span className="font-ui text-[13px] text-muted-foreground">
                {a.site_name}
              </span>
            )}
            {a.reading_time_minutes && (
              <span className="font-ui text-[11px] text-muted-foreground">
                {a.reading_time_minutes} min
              </span>
            )}
            {a.archived_at && (
              <span className="font-ui text-[11px] text-muted-foreground/60 ml-auto">
                {formatArchivedDate(a.archived_at)}
              </span>
            )}
          </div>
        </Link>
      ))}
    </div>
  )
}
