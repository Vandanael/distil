'use client'

import { useState } from 'react'
import { useLocale } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type URLListProps = {
  value: string[]
  onChange: (urls: string[]) => void
  placeholder?: string
  maxUrls?: number
  showCounter?: boolean
  id?: string
  disabled?: boolean
  'data-testid'?: string
}

/**
 * Normalise une URL avant ajout : trim, auto-préfixe https:// si schéma absent.
 * Rejette si format basique non valide.
 */
export function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  try {
    const parsed = new URL(withScheme)
    // Le hostname doit contenir au moins un point et pas d'espace
    if (!parsed.hostname.includes('.') || /\s/.test(parsed.hostname)) return null
    return withScheme
  } catch {
    return null
  }
}

export function URLList({
  value,
  onChange,
  placeholder,
  maxUrls,
  showCounter,
  id,
  disabled,
  'data-testid': testId,
}: URLListProps) {
  const { t } = useLocale()
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)

  function commit() {
    const normalized = normalizeUrl(draft)
    if (!normalized) {
      setError(t.forms.urlInvalid)
      return
    }
    if (value.includes(normalized)) {
      setDraft('')
      setError(null)
      return
    }
    if (maxUrls && value.length >= maxUrls) return
    onChange([...value, normalized])
    setDraft('')
    setError(null)
  }

  function removeAt(index: number) {
    const next = [...value]
    next.splice(index, 1)
    onChange(next)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      commit()
    }
  }

  const limitReached = maxUrls ? value.length >= maxUrls : false

  return (
    <div className="space-y-2" data-testid={testId}>
      {value.length > 0 && (
        <ul
          className="divide-y divide-border border border-input"
          data-testid={testId ? `${testId}-list` : undefined}
        >
          {value.map((url, i) => (
            <li
              key={`${url}-${i}`}
              className="flex items-center justify-between gap-2 px-3 py-2"
            >
              <span className="font-body text-sm text-foreground truncate">{url}</span>
              <button
                type="button"
                onClick={() => removeAt(i)}
                aria-label={`${t.forms.urlRemoveAria} ${url}`}
                disabled={disabled}
                className="shrink-0 text-muted-foreground hover:text-destructive transition-colors focus:outline-none focus-visible:text-destructive"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <Input
          id={id}
          type="text"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value)
            if (error) setError(null)
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? t.forms.urlAddPlaceholder}
          disabled={disabled || limitReached}
          aria-invalid={error ? true : undefined}
          data-testid={testId ? `${testId}-input` : undefined}
          className={cn(error && 'border-destructive')}
        />
        <Button
          type="button"
          variant="secondary"
          onClick={commit}
          disabled={disabled || !draft.trim() || limitReached}
        >
          {t.forms.urlAddButton}
        </Button>
      </div>

      <div className="flex items-center justify-between min-h-5">
        {error ? (
          <p className="font-ui text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : (
          <span />
        )}
        {showCounter && maxUrls ? (
          <span className="font-ui text-sm text-muted-foreground">
            {value.length} {t.forms.urlCounter} {maxUrls}
          </span>
        ) : null}
      </div>
    </div>
  )
}
