'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { markAsRead } from '../../actions'
import { HighlightPopover } from './components/HighlightPopover'
import { FloatingActionBar } from './components/FloatingActionBar'
import { ScoringPanel } from './components/ScoringPanel'

type Props = {
  id: string
  title: string | null
  author: string | null
  siteName: string | null
  publishedAt: string | null
  contentHtml: string
  readingTimeMinutes: number | null
  url: string
  score: number | null
  justification: string | null
  isSerendipity: boolean
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
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
  score,
  justification,
  isSerendipity,
}: Props) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [pendingHighlight, setPendingHighlight] = useState<{ id: string; text: string } | null>(
    null
  )

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
    <>
      <div className="max-w-2xl mx-auto px-4 py-8 pb-24 md:py-12 md:pb-24 space-y-10 w-full">
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
            className="inline-flex items-center gap-1 font-ui text-xs text-muted-foreground transition-colors hover:text-accent"
            data-testid="source-link"
          >
            <span>{siteName ?? extractDomain(url)}</span>
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="square"
              aria-hidden="true"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>

          {score !== null && (
            <ScoringPanel
              score={score}
              justification={justification}
              isSerendipity={isSerendipity}
            />
          )}
        </div>

        {/* Contenu selectionnable */}
        <div
          ref={contentRef}
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

      <HighlightPopover
        articleId={id}
        containerRef={contentRef}
        onHighlightSaved={(highlightId, text) => setPendingHighlight({ id: highlightId, text })}
      />

      <FloatingActionBar articleId={id} pendingHighlight={pendingHighlight} />
    </>
  )
}
