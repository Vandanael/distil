'use client'

import { useRef, useState } from 'react'
import { useLocale } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'

type TagInputProps = {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  maxTags?: number
  id?: string
  disabled?: boolean
  'data-testid'?: string
}

export function TagInput({
  value,
  onChange,
  placeholder,
  maxTags,
  id,
  disabled,
  'data-testid': testId,
}: TagInputProps) {
  const { t } = useLocale()
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function commit(raw: string) {
    const tag = raw.trim()
    if (!tag) return
    if (value.includes(tag)) {
      setDraft('')
      return
    }
    if (maxTags && value.length >= maxTags) return
    onChange([...value, tag])
    setDraft('')
  }

  function removeAt(index: number) {
    const next = [...value]
    next.splice(index, 1)
    onChange(next)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      commit(draft)
    } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      e.preventDefault()
      removeAt(value.length - 1)
    }
  }

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-1.5 border border-input bg-transparent px-2 py-2 min-h-[2.5rem] transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50',
        disabled && 'opacity-50 pointer-events-none'
      )}
      data-testid={testId}
    >
      {value.map((tag, i) => (
        <span
          key={`${tag}-${i}`}
          className="inline-flex items-center gap-1 bg-muted text-foreground font-ui text-sm px-2.5 py-1"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeAt(i)}
            aria-label={`${t.forms.tagRemoveAria} ${tag}`}
            className="text-muted-foreground hover:text-destructive transition-colors focus:outline-none focus-visible:text-destructive"
            tabIndex={0}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => commit(draft)}
        placeholder={placeholder ?? t.forms.tagAddPlaceholder}
        disabled={disabled}
        className="flex-1 min-w-[8rem] bg-transparent font-ui text-sm text-foreground outline-none placeholder:text-muted-foreground"
      />
    </div>
  )
}
