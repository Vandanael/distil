'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

type Props = {
  sources: string[]
  onChange: (sources: string[]) => void
}

export function StepSources({ sources, onChange }: Props) {
  const [draft, setDraft] = useState('')

  function addSource() {
    const trimmed = draft.trim()
    if (trimmed && !sources.includes(trimmed)) {
      onChange([...sources, trimmed])
    }
    setDraft('')
  }

  function removeSource(item: string) {
    onChange(sources.filter((s) => s !== item))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addSource()
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-foreground">
          Vos sources
        </h2>
        <p className="font-[family-name:var(--font-source-serif)] text-sm text-muted-foreground">
          Sites, blogs ou publications que vous lisez déjà. Laissez vide si vous voulez découvrir.
        </p>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Ex: lemonde.fr, paulgraham.com..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          data-testid="source-input"
        />
        <Button type="button" variant="secondary" onClick={addSource} disabled={!draft.trim()}>
          Ajouter
        </Button>
      </div>

      {sources.length > 0 && (
        <div className="flex flex-wrap gap-2" data-testid="sources-list">
          {sources.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-muted text-sm font-[family-name:var(--font-geist)] text-foreground"
            >
              {item}
              <button
                type="button"
                onClick={() => removeSource(item)}
                className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                aria-label={`Supprimer ${item}`}
              >
                x
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
