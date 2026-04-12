'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { markAsRead } from '../../actions'
import { HighlightPopover } from './components/HighlightPopover'
import { FloatingActionBar } from './components/FloatingActionBar'
import { ScoringPanel } from './components/ScoringPanel'
import { ReadingProgress } from './components/ReadingProgress'

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
      <ReadingProgress />
      {/* Layout desktop : contenu decale a droite avec marge editoriale */}
      <div className="w-full max-w-4xl mx-auto px-4 py-8 pb-40 md:py-12 md:pb-32">
        <div className="md:grid md:grid-cols-[1fr_minmax(0,640px)] md:gap-0">
          {/* Colonne gauche desktop : navigation sticky */}
          <div className="hidden md:block pt-1">
            <div className="sticky top-20">
              <Link
                href="/feed"
                className="font-ui text-sm text-muted-foreground transition-colors hover:text-accent"
                data-testid="back-to-feed"
              >
                &larr; Feed
              </Link>
            </div>
          </div>

          {/* Colonne droite : article */}
          <div className="space-y-10">
            {/* Back link mobile only */}
            <Link
              href="/feed"
              className="md:hidden font-ui text-sm text-muted-foreground transition-colors hover:text-accent"
              data-testid="back-to-feed-mobile"
            >
              &larr; Feed
            </Link>

            {/* En-tete article */}
            <div className="space-y-4 border-b border-border pb-8">
              <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-ui font-medium text-accent hover:underline"
                  data-testid="source-link"
                >
                  {siteName ?? extractDomain(url)}
                </a>
                {readingTimeMinutes && (
                  <>
                    <span>·</span>
                    <span className="font-ui">{readingTimeMinutes} min</span>
                  </>
                )}
                {publishedDate && (
                  <>
                    <span>·</span>
                    <span className="font-ui">{publishedDate}</span>
                  </>
                )}
              </div>

              <h1 className="font-heading text-3xl leading-snug text-foreground">
                {title ?? 'Sans titre'}
              </h1>

              {author && (
                <p className="font-ui text-sm text-muted-foreground">{author}</p>
              )}
            </div>

            {/* Contenu selectionnable */}
            {contentHtml ? (
              <div
                ref={contentRef}
                className="prose max-w-none font-body text-foreground article-prose"
                data-testid="article-content"
                dangerouslySetInnerHTML={{ __html: contentHtml }}
              />
            ) : (
              <div
                ref={contentRef}
                className="space-y-6 py-8 border border-border p-6"
                data-testid="article-content-unavailable"
              >
                <p className="font-ui text-[13px] text-muted-foreground">
                  Contenu non disponible
                </p>
                <p className="font-body text-sm text-muted-foreground leading-relaxed">
                  Le contenu de cet article n&apos;a pas pu etre recupere - il est probablement protege
                  par un paywall ou inaccessible au parsing.
                </p>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-ui text-sm text-accent hover:underline"
                >
                  Lire sur {siteName ?? extractDomain(url)}
                  <svg
                    width="12"
                    height="12"
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
              </div>
            )}

            {/* Scoring en fin de lecture */}
            {score !== null && (
              <ScoringPanel
                score={score}
                justification={justification}
                isSerendipity={isSerendipity}
              />
            )}

            {/* Bas de page desktop */}
            <div className="hidden md:block border-t border-border pt-8">
              <Link
                href="/feed"
                className="font-ui text-sm text-muted-foreground transition-colors hover:text-accent"
              >
                &larr; Retour au feed
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Retour au feed sticky mobile */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 z-20 px-4 pb-3 pointer-events-none">
        <Link
          href="/feed"
          className="pointer-events-auto block w-full text-center font-ui text-sm font-medium bg-foreground text-background py-3 hover:bg-accent transition-colors"
        >
          &larr; Retour au feed
        </Link>
      </div>

      <HighlightPopover
        articleId={id}
        containerRef={contentRef}
        onHighlightSaved={(highlightId, text) => setPendingHighlight({ id: highlightId, text })}
      />

      <FloatingActionBar
        articleId={id}
        articleTitle={title}
        articleUrl={url}
        pendingHighlight={pendingHighlight}
      />
    </>
  )
}
