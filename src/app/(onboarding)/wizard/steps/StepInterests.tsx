'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

type Props = {
  interests: string[]
  onChange: (interests: string[]) => void
}

export function StepInterests({ interests, onChange }: Props) {
  const [draft, setDraft] = useState('')

  function addInterest() {
    const trimmed = draft.trim()
    if (trimmed && !interests.includes(trimmed)) {
      onChange([...interests, trimmed])
    }
    setDraft('')
  }

  function removeInterest(item: string) {
    onChange(interests.filter((i) => i !== item))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addInterest()
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-foreground">
          Vos interets
        </h2>
        <p className="font-[family-name:var(--font-source-serif)] text-sm text-muted-foreground">
          Ajoutez des themes, domaines ou mots-cles. Appuyez Entree pour valider.
        </p>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Ex: machine learning, geopolitique..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          data-testid="interest-input"
        />
        <Button type="button" variant="secondary" onClick={addInterest} disabled={!draft.trim()}>
          Ajouter
        </Button>
      </div>

      {interests.length > 0 && (
        <div className="flex flex-wrap gap-2" data-testid="interests-list">
          {interests.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-muted text-sm font-[family-name:var(--font-geist)] text-foreground"
            >
              {item}
              <button
                type="button"
                onClick={() => removeInterest(item)}
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
