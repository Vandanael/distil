'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { markAsRead } from '@/app/(main)/actions'
import { useLocale } from '@/lib/i18n/context'
import { useScrollEndDetection } from '@/lib/hooks/useScrollEndDetection'
import { HighlightPopover } from './components/HighlightPopover'
import { FloatingActionBar } from './components/FloatingActionBar'
import { ReadingProgress } from './components/ReadingProgress'
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus'
import { scoreToTag, type RelevanceTag } from '@/lib/scoring/tag'
import { extractDomain } from '@/lib/url'

type Props = {
  id: string
  title: string | null
  author: string | null
  siteName: string | null
  publishedAt: string | null
  contentHtml: string
  truncated: boolean
  readingTimeMinutes: number | null
  url: string
  returnTo: '/feed' | '/library'
  bucket: 'essential' | 'surprise' | null
  isSerendipity: boolean
  origin: string
}

export function ReadingView({
  id,
  title,
  author,
  siteName,
  publishedAt,
  contentHtml,
  truncated,
  readingTimeMinutes,
  url,
  returnTo,
  bucket,
  isSerendipity,
  origin,
}: Props) {
  const tag: RelevanceTag = scoreToTag(null, bucket, isSerendipity, origin)
  const contentRef = useRef<HTMLDivElement>(null)
  const [pendingHighlight, setPendingHighlight] = useState<{ id: string; text: string } | null>(
    null
  )
  const isOnline = useOnlineStatus()
  const { locale, t } = useLocale()

  // Scroll-end 85% : passe l'article en read sans bloquer l'UI, sans redirect.
  useScrollEndDetection(contentRef, () => {
    void markAsRead(id)
  })

  // Forcer target="_blank" sur tous les liens du contenu article (DOMPurify strip l'attribut sur les anciens articles)
  useEffect(() => {
    if (!contentRef.current) return
    const links = contentRef.current.querySelectorAll<HTMLAnchorElement>('a[href]')
    links.forEach((link) => {
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
    })
  }, [contentHtml])

  // Raccourci clavier h : focus sur le contenu pour faciliter la selection et le highlight
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (document.activeElement?.tagName ?? '').toLowerCase()
      if (
        tag === 'input' ||
        tag === 'textarea' ||
        document.activeElement?.hasAttribute('contenteditable')
      )
        return
      if (e.key === 'h') {
        e.preventDefault()
        contentRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  const publishedDate = publishedAt
    ? new Date(publishedAt).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

  const sourceLabel = siteName ?? extractDomain(url)

  return (
    <>
      <ReadingProgress />
      {!isOnline && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-0 left-0 right-0 z-50 bg-muted border-b border-border py-1.5 text-center font-ui text-sm text-muted-foreground"
        >
          Vous êtes hors-ligne - certaines actions sont désactivées
        </div>
      )}
      {/* Layout desktop : pleine largeur feed, contenu decale avec marge editoriale */}
      <div className="w-full max-w-[1160px] mx-auto px-4 py-8 pb-32 md:py-16 md:pb-32">
        <div className="md:grid md:grid-cols-[minmax(220px,1fr)_minmax(0,820px)] md:gap-10">
          {/* Colonne gauche desktop : navigation sticky */}
          <div className="hidden md:block pt-1">
            <div className="sticky top-20 space-y-3">
              <Link
                href={returnTo}
                aria-label="Retour"
                className="block font-ui text-sm text-muted-foreground transition-colors hover:text-accent"
                data-testid="back-to-feed"
              >
                {returnTo === '/library'
                  ? locale === 'fr'
                    ? 'Retour à À lire'
                    : 'Back to To read'
                  : locale === 'fr'
                    ? 'Retour au Feed'
                    : 'Back to Feed'}
              </Link>
            </div>
          </div>

          {/* Colonne droite : article */}
          <div className="space-y-10">
            {/* Back link mobile only */}
            <Link
              href={returnTo}
              className="md:hidden font-ui text-sm text-muted-foreground transition-colors hover:text-accent"
              data-testid="back-to-feed-mobile"
            >
              {returnTo === '/library'
                ? locale === 'fr'
                  ? 'Retour à À lire'
                  : 'Back to To read'
                : locale === 'fr'
                  ? 'Retour au Feed'
                  : 'Back to Feed'}
            </Link>

            {/* En-tete article */}
            <div className="space-y-5 border-b border-border pb-10">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-ui font-medium text-accent hover:underline"
                  data-testid="source-link"
                  title={locale === 'fr' ? "Ouvrir l'original" : 'Open original'}
                >
                  {sourceLabel}
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
                {tag && (
                  <span className="font-ui text-xs uppercase tracking-wider text-muted-foreground ml-2">
                    {tag === 'relevant' ? t.article.tagRelevant : t.article.tagDiscovery}
                  </span>
                )}
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

              <h1 className="font-heading text-[32px] md:text-[44px] leading-[1.15] tracking-tight text-foreground">
                {title ?? 'Sans titre'}
              </h1>

              {author && <p className="font-ui text-base text-muted-foreground">{author}</p>}
            </div>

            {/* Contenu selectionnable */}
            {contentHtml ? (
              <div
                ref={contentRef}
                className="prose max-w-none font-body text-foreground article-prose"
                data-testid="article-content"
                tabIndex={-1}
                dangerouslySetInnerHTML={{ __html: contentHtml }}
              />
            ) : (
              <div
                ref={contentRef}
                className="space-y-6 py-8 border border-border p-6"
                data-testid="article-content-unavailable"
              >
                <p className="font-ui text-sm text-muted-foreground">Contenu non disponible</p>
                <p className="font-body text-base text-muted-foreground leading-relaxed">
                  Le contenu de cet article n&apos;a pas pu être récupéré - il est probablement
                  protégé par un paywall ou inaccessible au parsing.
                </p>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-ui text-sm text-accent hover:underline"
                >
                  Lire sur {sourceLabel}
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

            {/* Encart "Extrait - lire sur source" : uniquement si le contenu a été tronqué */}
            {truncated && contentHtml && (
              <div data-testid="extract-cta" className="border-t border-border pt-8 space-y-4">
                <p className="font-ui text-sm text-muted-foreground">
                  {t.reading.extractLabel} <span className="text-foreground">{sourceLabel}</span>
                </p>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="read-on-source"
                  className="inline-flex items-center gap-2 font-ui text-[15px] font-medium bg-accent text-background px-5 py-3 hover:bg-foreground transition-colors"
                >
                  {locale === 'fr' ? 'Lire sur' : 'Read on'} {sourceLabel}
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              </div>
            )}
          </div>
        </div>
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
        returnTo={returnTo}
      />
    </>
  )
}
