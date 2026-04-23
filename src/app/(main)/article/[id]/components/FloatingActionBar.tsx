'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { addToRead } from '../actions'
import { markAsRead } from '@/app/(main)/actions'
import { NoteEditor } from './NoteEditor'
import { TagInput } from './TagInput'
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus'
import { useAutoHideOnScroll } from '@/lib/hooks/useAutoHideOnScroll'
import { useLocale } from '@/lib/i18n/context'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

type Props = {
  articleId: string
  articleTitle: string | null
  articleUrl: string
  pendingHighlight: { id: string; text: string } | null
  returnTo: '/feed' | '/library'
}

export function FloatingActionBar({
  articleId,
  articleTitle,
  articleUrl,
  pendingHighlight,
  returnTo,
}: Props) {
  const { t } = useLocale()
  const [showNote, setShowNote] = useState(false)
  const [showTag, setShowTag] = useState(false)
  const [tags, setTags] = useState<string[]>([])
  const [archived, setArchived] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isMarking, startMarking] = useTransition()
  const isOnline = useOnlineStatus()
  const visible = useAutoHideOnScroll()
  const router = useRouter()
  const undoRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cancelledRef = useRef(false)

  async function handleShare() {
    const shareData = { title: articleTitle ?? 'Article Distil', url: articleUrl }
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData)
      } catch {
        // Annule par l'utilisateur, pas d'erreur a afficher
      }
    } else {
      await navigator.clipboard.writeText(articleUrl)
      toast.success(t.actions.linkCopied)
    }
  }

  function handleArchive() {
    // Flip UI instantanement, vrai archivage apres 4s si pas d'undo.
    setArchived(true)
    cancelledRef.current = false
    if (undoRef.current) clearTimeout(undoRef.current)

    toast.success(t.article.addedToRead, {
      action: {
        label: t.article.undo,
        onClick: () => {
          cancelledRef.current = true
          if (undoRef.current) clearTimeout(undoRef.current)
          setArchived(false)
        },
      },
      duration: 4000,
    })

    undoRef.current = setTimeout(() => {
      if (cancelledRef.current) return
      startTransition(async () => {
        try {
          await addToRead(articleId)
        } catch {
          setArchived(false)
          toast.error(t.actions.archiveFailed)
        }
      })
    }, 4000)
  }

  if (archived) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center border-t border-border bg-background px-8 py-4">
        <span className="font-ui text-sm text-muted-foreground">{t.actions.archived}</span>
      </div>
    )
  }

  return (
    <>
      {showNote && (
        <NoteEditor
          articleId={articleId}
          highlightId={pendingHighlight?.id}
          highlightText={pendingHighlight?.text}
          onClose={() => setShowNote(false)}
        />
      )}
      {showTag && (
        <TagInput
          articleId={articleId}
          existingTags={tags}
          onTagAdded={(t) => setTags((prev) => [...prev, t])}
          onClose={() => setShowTag(false)}
        />
      )}

      <div
        className={[
          'fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between border-t border-border bg-background px-4 py-1',
          'transition-transform duration-200 ease-out motion-reduce:transition-none',
          'focus-within:translate-y-0',
          'lg:translate-y-0',
          visible ? 'translate-y-0' : 'translate-y-full',
        ].join(' ')}
        aria-hidden={!visible || undefined}
        data-testid="floating-action-bar"
        data-visible={visible ? 'true' : 'false'}
      >
        {/* Actions secondaires a gauche */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => void handleShare()}
            disabled={!isOnline}
            className="inline-flex items-center justify-center h-11 w-11 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
            data-testid="action-share"
            aria-label={t.actions.share}
            title={isOnline ? t.actions.share : t.actions.offline}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => {
              setShowNote(true)
              setShowTag(false)
            }}
            disabled={!isOnline}
            className="inline-flex items-center justify-center h-11 px-3 font-ui text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
            data-testid="action-note"
            aria-label={t.actions.noteAria}
            title={isOnline ? undefined : t.actions.offline}
          >
            Note
          </button>
          <button
            type="button"
            onClick={() => {
              setShowTag(true)
              setShowNote(false)
            }}
            disabled={!isOnline}
            className="inline-flex items-center justify-center h-11 px-3 font-ui text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
            data-testid="action-tag"
            aria-label={t.actions.tagAria}
            title={isOnline ? undefined : t.actions.offline}
          >
            Tag
          </button>
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  onClick={() => {
                    startMarking(async () => {
                      await markAsRead(articleId)
                      router.push(returnTo)
                    })
                  }}
                  disabled={!isOnline || isMarking}
                  className="inline-flex items-center justify-center h-11 px-3 font-ui text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                  data-testid="action-mark-read"
                  aria-label={t.reading.markReadAria}
                />
              }
            >
              {t.reading.markRead}
            </TooltipTrigger>
            <TooltipContent side="top" className="hidden md:block">
              <p className="font-ui text-sm">{t.reading.markReadTooltip}</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Tags affiches */}
        {tags.length > 0 && (
          <div className="flex gap-1">
            {tags.map((tag) => (
              <span
                key={tag}
                className="font-ui text-sm bg-muted text-muted-foreground px-2 py-0.5"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Action primaire a droite */}
        <button
          type="button"
          onClick={handleArchive}
          disabled={isPending || !isOnline}
          className="inline-flex items-center justify-center h-11 px-3 font-ui text-sm font-medium text-accent transition-colors hover:text-foreground disabled:opacity-50"
          data-testid="action-archive"
          aria-label={t.article.addToRead}
          title={isOnline ? undefined : t.actions.offline}
        >
          {t.article.addToReadShort}
        </button>
      </div>
    </>
  )
}
