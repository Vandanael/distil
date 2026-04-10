'use client'

import { useState, useTransition } from 'react'
import { addTag } from '../actions'

type Props = {
  articleId: string
  existingTags: string[]
  onTagAdded: (tag: string) => void
  onClose: () => void
}

export function TagInput({ articleId, existingTags, onTagAdded, onClose }: Props) {
  const [value, setValue] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      submit()
    }
    if (e.key === 'Escape') onClose()
  }

  function submit() {
    const tag = value.trim().toLowerCase()
    if (!tag || existingTags.includes(tag)) {
      setValue('')
      return
    }
    startTransition(async () => {
      await addTag(articleId, tag)
      onTagAdded(tag)
      setValue('')
    })
  }

  return (
    <div
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 border border-border bg-background px-3 py-2"
      data-testid="tag-input-container"
    >
      {existingTags.map((t) => (
        <span key={t} className="font-ui text-xs bg-muted text-muted-foreground px-2 py-0.5">
          {t}
        </span>
      ))}
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={onClose}
        placeholder="tag..."
        disabled={isPending}
        autoFocus
        data-testid="tag-input"
        className="font-ui text-sm bg-transparent outline-none text-foreground placeholder:text-muted-foreground w-24"
      />
    </div>
  )
}
