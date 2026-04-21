'use client'

import { useState } from 'react'
import { useLocale } from '@/lib/i18n/context'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { normalizeUrl } from './URLList'

type BulkPasteProps = {
  onParse: (urls: string[]) => void
  placeholder?: string
  disabled?: boolean
  'data-testid'?: string
}

/**
 * Split un blob texte en tokens d'URL candidats.
 * Séparateurs supportés : saut de ligne, virgule, espace, tabulation, point-virgule.
 */
export function splitBulk(input: string): string[] {
  return input
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export function BulkPaste({
  onParse,
  placeholder,
  disabled,
  'data-testid': testId,
}: BulkPasteProps) {
  const { t } = useLocale()
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)

  function handleAdd() {
    const tokens = splitBulk(value)
    if (tokens.length === 0) {
      setFeedback(t.forms.bulkNoValid)
      return
    }
    const valid: string[] = []
    let ignored = 0
    for (const token of tokens) {
      const normalized = normalizeUrl(token)
      if (normalized && !valid.includes(normalized)) {
        valid.push(normalized)
      } else if (!normalized) {
        ignored += 1
      }
    }
    if (valid.length === 0) {
      setFeedback(t.forms.bulkNoValid)
      return
    }
    onParse(valid)
    setValue('')
    const parts = [`${valid.length} ${t.forms.bulkFeedbackAdded}`]
    if (ignored > 0) parts.push(`${ignored} ${t.forms.bulkFeedbackIgnored}`)
    setFeedback(parts.join(' · '))
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        data-testid={testId ? `${testId}-toggle` : undefined}
        className="font-ui text-sm text-muted-foreground hover:text-accent transition-colors disabled:opacity-40"
      >
        {t.forms.bulkToggle}
      </button>
    )
  }

  return (
    <div className="space-y-2" data-testid={testId}>
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder ?? t.forms.bulkPlaceholder}
        rows={4}
        disabled={disabled}
        data-testid={testId ? `${testId}-textarea` : undefined}
      />
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleAdd}
          disabled={disabled || !value.trim()}
        >
          {t.forms.bulkAddButton}
        </Button>
        {feedback && (
          <span className="font-ui text-sm text-muted-foreground">{feedback}</span>
        )}
      </div>
    </div>
  )
}
