'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { markAsRead } from '../../actions'

type Props = {
  id: string
  title: string | null
  author: string | null
  siteName: string | null
  publishedAt: string | null
  contentHtml: string
  readingTimeMinutes: number | null
  url: string
}

export function ReadingView({
  id,
  title,
  author,
  siteName,
  publishedAt,
  contentHtml,
  readingTimeMinutes,
  url,
}: Props) {
  useEffect(() => {
    markAsRead(id)
  }, [id])

  const publishedDate = publishedAt
    ? new Date(publishedAt).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

  return (
    <main className="flex min-h-full flex-col p-8 md:p-16 bg-background">
      <div className="w-full max-w-2xl space-y-10">
        {/* Navigation */}
        <Link
          href="/feed"
          className="font-ui text-sm text-muted-foreground transition-colors hover:text-accent"
          data-testid="back-to-feed"
        >
          &larr; Feed
        </Link>

        {/* En-tete article */}
        <div className="space-y-4 border-b border-border pb-8">
          <div className="flex items-center gap-3">
            {siteName && (
              <span className="font-ui text-[10px] uppercase tracking-widest text-accent">
                {siteName}
              </span>
            )}
            {readingTimeMinutes && (
              <span className="font-ui text-[10px] text-muted-foreground">
                {readingTimeMinutes} min
              </span>
            )}
          </div>

          <h1 className="font-heading text-3xl leading-snug text-foreground">
            {title ?? 'Sans titre'}
          </h1>

          <div className="flex items-center gap-4">
            {author && <span className="font-ui text-sm text-muted-foreground">{author}</span>}
            {publishedDate && (
              <span className="font-ui text-sm text-muted-foreground">{publishedDate}</span>
            )}
          </div>

          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-ui text-xs text-muted-foreground transition-colors hover:text-accent break-all"
          >
            {url}
          </a>
        </div>

        {/* Contenu */}
        <div
          className="prose prose-sm max-w-none font-body text-foreground [&_h2]:font-heading [&_h2]:text-xl [&_h2]:mt-8 [&_h2]:mb-3 [&_p]:mb-4 [&_p]:leading-relaxed [&_a]:text-accent [&_a]:no-underline [&_a:hover]:underline"
          data-testid="article-content"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />

        {/* Bas de page */}
        <div className="border-t border-border pt-8">
          <Link
            href="/feed"
            className="font-ui text-sm text-muted-foreground transition-colors hover:text-accent"
          >
            &larr; Retour au feed
          </Link>
        </div>
      </div>
    </main>
  )
}
