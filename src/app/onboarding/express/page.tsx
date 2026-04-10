'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { createProfile } from '../actions'

const SECTORS = [
  'Consulting',
  'Design',
  'Developpement',
  'Finance',
  'Ingenierie',
  'Journalisme',
  'Marketing',
  'Medecine',
  'Produit',
  'Recherche',
  'Droit',
  'Autre',
]

export default function ExpressPage() {
  const [profileText, setProfileText] = useState('')
  const [sector, setSector] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    startTransition(async () => {
      await createProfile({
        method: 'express',
        profile_text: profileText || undefined,
        sector: sector || undefined,
      })
    })
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8 bg-background">
      <div className="text-center space-y-2">
        <h1 className="font-[family-name:var(--font-fraunces)] text-3xl font-semibold text-foreground">
          En quelques mots
        </h1>
        <p className="font-[family-name:var(--font-source-serif)] text-muted-foreground max-w-sm">
          {"Decrivez librement ce qui vous interesse. L'IA s'adapte a votre style."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-5">
        <div className="space-y-2">
          <Label
            htmlFor="profile-text"
            className="font-[family-name:var(--font-geist)] text-sm text-foreground"
          >
            {"Vos centres d'interet"} <span className="text-muted-foreground">(optionnel)</span>
          </Label>
          <Textarea
            id="profile-text"
            placeholder="Ex: PM senior, product strategy, IA appliquee, startups B2B, lecture longue forme..."
            value={profileText}
            onChange={(e) => setProfileText(e.target.value)}
            rows={4}
            disabled={isPending}
            data-testid="profile-text"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="sector"
            className="font-[family-name:var(--font-geist)] text-sm text-foreground"
          >
            Secteur <span className="text-muted-foreground">(optionnel)</span>
          </Label>
          <select
            id="sector"
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            disabled={isPending}
            data-testid="sector-select"
            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm font-[family-name:var(--font-geist)] text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">-- Selectionnez --</option>
            {SECTORS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <Button type="submit" disabled={isPending} data-testid="submit-express">
            {isPending ? 'Creation du profil...' : 'Demarrer'}
          </Button>
          <Link
            href="/onboarding/wizard"
            className="text-center text-sm text-muted-foreground hover:text-foreground font-[family-name:var(--font-geist)] transition-colors"
          >
            Personnaliser davantage
          </Link>
        </div>
      </form>
    </main>
  )
}
