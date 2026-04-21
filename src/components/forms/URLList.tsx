'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
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

/**
 * Clé de tri alphabétique par domaine : retire schéma et www.
 */
function sortKey(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./i, '')
    return host.toLowerCase()
  } catch {
    return url.replace(/^https?:\/\//i, '').replace(/^www\./i, '').toLowerCase()
  }
}

const HIGHLIGHT_MS = 2500

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
  const [highlighted, setHighlighted] = useState<Set<string>>(() => new Set())

  const prevValueRef = useRef<string[]>(value)
  const itemRefs = useRef<Map<string, HTMLLIElement | null>>(new Map())
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  // Détection des URLs ajoutées (interne via commit ou externe via OPML),
  // pour déclencher highlight + scroll vers la dernière ligne insérée.
  useEffect(() => {
    const prev = new Set(prevValueRef.current)
    const added = value.filter((u) => !prev.has(u))
    if (added.length > 0) {
      setHighlighted((curr) => {
        const next = new Set(curr)
        for (const u of added) next.add(u)
        return next
      })
      for (const u of added) {
        const existing = timersRef.current.get(u)
        if (existing) clearTimeout(existing)
        const timer = setTimeout(() => {
          setHighlighted((curr) => {
            if (!curr.has(u)) return curr
            const next = new Set(curr)
            next.delete(u)
            return next
          })
          timersRef.current.delete(u)
        }, HIGHLIGHT_MS)
        timersRef.current.set(u, timer)
      }
      const lastAdded = added[added.length - 1]
      const el = itemRefs.current.get(lastAdded)
      el?.scrollIntoView?.({ behavior: 'smooth', block: 'center' })
    }
    prevValueRef.current = value
  }, [value])

  useEffect(() => {
    const timers = timersRef.current
    return () => {
      for (const timer of timers.values()) clearTimeout(timer)
      timers.clear()
    }
  }, [])

  // Vue triée alphabétiquement par domaine normalisé, sans muter le stockage.
  const sortedEntries = useMemo(() => {
    return value
      .map((url, index) => ({ url, index }))
      .sort((a, b) => sortKey(a.url).localeCompare(sortKey(b.url)))
  }, [value])

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

  function removeByUrl(url: string) {
    onChange(value.filter((u) => u !== url))
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
      {sortedEntries.length > 0 && (
        <ul
          className="divide-y divide-border border border-input"
          data-testid={testId ? `${testId}-list` : undefined}
        >
          {sortedEntries.map(({ url }) => {
            const isHighlighted = highlighted.has(url)
            return (
              <li
                key={url}
                ref={(el) => {
                  if (el) itemRefs.current.set(url, el)
                  else itemRefs.current.delete(url)
                }}
                data-highlighted={isHighlighted ? 'true' : undefined}
                className={cn(
                  'flex items-center justify-between gap-2 px-3 py-2 transition-colors duration-500',
                  isHighlighted ? 'bg-primary/5' : 'bg-transparent'
                )}
              >
                <span className="font-body text-sm text-foreground truncate">{url}</span>
                <button
                  type="button"
                  onClick={() => removeByUrl(url)}
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
            )
          })}
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
