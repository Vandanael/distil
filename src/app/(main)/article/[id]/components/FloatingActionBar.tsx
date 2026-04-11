'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { archiveArticle } from '../actions'
import { NoteEditor } from './NoteEditor'
import { TagInput } from './TagInput'

type Props = {
  articleId: string
  articleTitle: string | null
  articleUrl: string
  pendingHighlight: { id: string; text: string } | null
}

export function FloatingActionBar({
  articleId,
  articleTitle,
  articleUrl,
  pendingHighlight,
}: Props) {
  const [showNote, setShowNote] = useState(false)
  const [showTag, setShowTag] = useState(false)
  const [tags, setTags] = useState<string[]>([])
  const [archived, setArchived] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function handleShare() {
    const shareData = { title: articleTitle ?? 'Article Distil', url: articleUrl }
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData)
      } catch {
        // Annule par l'utilisateur — pas d'erreur a afficher
      }
    } else {
      await navigator.clipboard.writeText(articleUrl)
      toast.success('Lien copie')
    }
  }

  function handleArchive() {
    startTransition(async () => {
      await archiveArticle(articleId)
      setArchived(true)
      toast.success('Article archivé')
    })
  }

  if (archived) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-30 flex justify-center border-t border-border bg-background px-8 py-4">
        <span className="font-ui text-sm text-muted-foreground">Archive.</span>
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
        className="fixed bottom-0 left-0 right-0 z-30 flex flex-wrap items-center justify-center gap-4 border-t border-border bg-background px-4 py-4"
        data-testid="floating-action-bar"
      >
        {tags.length > 0 && (
          <div className="flex gap-1">
            {tags.map((t) => (
              <span key={t} className="font-ui text-xs bg-muted text-muted-foreground px-2 py-0.5">
                {t}
              </span>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => void handleShare()}
          className="font-ui text-sm text-muted-foreground transition-colors hover:text-foreground"
          data-testid="action-share"
        >
          Partager
        </button>
        <button
          type="button"
          onClick={() => {
            setShowTag(true)
            setShowNote(false)
          }}
          className="font-ui text-sm text-muted-foreground transition-colors hover:text-foreground"
          data-testid="action-tag"
        >
          Tag
        </button>
        <button
          type="button"
          onClick={() => {
            setShowNote(true)
            setShowTag(false)
          }}
          className="font-ui text-sm text-muted-foreground transition-colors hover:text-foreground"
          data-testid="action-note"
        >
          Note
        </button>
        <button
          type="button"
          onClick={handleArchive}
          disabled={isPending}
          className="font-ui text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          data-testid="action-archive"
        >
          {isPending ? '...' : 'Archiver'}
        </button>
      </div>
    </>
  )
}
