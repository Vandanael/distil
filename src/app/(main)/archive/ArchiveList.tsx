'use client'

import Link from 'next/link'
import { useLocale } from '@/lib/i18n/context'

type Article = {
  id: string
  title: string | null
  site_name: string | null
  url: string
  reading_time_minutes: number | null
  archived_at: string | null
  score: number | null
}

function formatArchivedDate(iso: string | null, locale: 'fr' | 'en'): string {
  if (!iso) return ''
  const date = new Date(iso)
  const diffD = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
  const isFr = locale === 'fr'
  if (diffD === 0) return isFr ? "aujourd'hui" : 'today'
  if (diffD === 1) return isFr ? 'hier' : 'yesterday'
  if (diffD < 7) return isFr ? `il y a ${diffD}j` : `${diffD}d ago`
  return date.toLocaleDateString(isFr ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

type Props = { articles: Article[] }

export function ArchiveList({ articles }: Props) {
  const { locale } = useLocale()
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
          Retour au Feed
        </Link>
      </div>
    )
  }

  return (
    <div
      className="space-y-3 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-x-10 lg:gap-y-0"
      data-testid="archive-list"
    >
      {articles.map((a) => (
        <Link
          key={a.id}
          href={`/article/${a.id}`}
          className="group block space-y-2 border-b border-border pb-6 lg:py-6 lg:mb-0 last:border-0"
          data-testid={`archive-card-${a.id}`}
        >
          <h2 className="font-ui text-base font-semibold text-foreground leading-snug group-hover:text-accent transition-colors">
            {a.title ?? 'Sans titre'}
          </h2>
          <div className="flex items-center gap-3">
            {a.site_name && (
              <span className="font-ui text-sm text-muted-foreground">{a.site_name}</span>
            )}
            {a.reading_time_minutes && (
              <span className="font-ui text-sm text-muted-foreground">
                {a.reading_time_minutes} min
              </span>
            )}
            {a.archived_at && (
              <span className="font-ui text-sm text-muted-foreground/60 ml-auto">
                {formatArchivedDate(a.archived_at, locale)}
              </span>
            )}
          </div>
        </Link>
      ))}
    </div>
  )
}
