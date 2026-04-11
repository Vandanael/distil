'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { saveNote } from '../actions'

type Props = {
  articleId: string
  highlightId?: string
  highlightText?: string
  onClose: () => void
}

export function NoteEditor({ articleId, highlightId, highlightText, onClose }: Props) {
  const [content, setContent] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    if (!content.trim()) return
    startTransition(async () => {
      await saveNote(articleId, content.trim(), highlightId)
      toast.success('Note enregistrée')
      setContent('')
      onClose()
    })
  }

  return (
    <div
      className="fixed bottom-20 inset-x-4 z-40 space-y-3 border border-border bg-background p-4 shadow-lg md:inset-x-auto md:right-8 md:w-80"
      data-testid="note-editor"
    >
      {highlightText && (
        <p className="font-body text-xs italic text-muted-foreground line-clamp-2 border-l-2 border-accent pl-2">
          {highlightText}
        </p>
      )}
      <Textarea
        placeholder="Votre note..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        disabled={isPending}
        autoFocus
        data-testid="note-content"
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isPending || !content.trim()}
          data-testid="save-note"
        >
          {isPending ? '...' : 'Enregistrer'}
        </Button>
        <Button variant="secondary" size="sm" onClick={onClose} disabled={isPending}>
          Annuler
        </Button>
      </div>
    </div>
  )
}
