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
  const canSubmit = profileText.trim().length > 0 || sector !== ''

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
    <main className="flex min-h-full flex-col items-center justify-center p-8 bg-background">
      <div className="w-full max-w-md space-y-10">
        {/* En-tete */}
        <div className="space-y-4">
          <p className="font-ui text-xs uppercase tracking-wider text-accent">Methode rapide</p>
          <h1 className="font-heading text-4xl font-semibold text-foreground">En quelques mots</h1>
          <p className="font-body text-base text-muted-foreground">
            {"Decrivez librement ce qui vous interesse. L'IA s'adapte a votre style."}
          </p>
          <div className="h-px bg-border" />
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label
              htmlFor="profile-text"
              className="font-ui text-xs uppercase tracking-wider text-muted-foreground"
            >
              {"Vos centres d'interet"}
            </Label>
            <Textarea
              id="profile-text"
              placeholder="Ex: PM senior, product strategy, IA appliquee, startups B2B..."
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
              className="font-ui text-xs uppercase tracking-wider text-muted-foreground"
            >
              Secteur
            </Label>
            <select
              id="sector"
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              disabled={isPending}
              data-testid="sector-select"
              className="h-10 w-full border border-input bg-background px-3 font-ui text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">-- Selectionnez --</option>
              {SECTORS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3 pt-2">
            <Button
              type="submit"
              className="w-full h-11"
              disabled={isPending || !canSubmit}
              data-testid="submit-express"
            >
              {isPending ? 'Creation du profil...' : 'Demarrer Distil'}
            </Button>
            <Link
              href="/onboarding/wizard"
              className="block text-center font-ui text-sm text-muted-foreground transition-colors hover:text-accent"
            >
              Personnaliser davantage &rarr;
            </Link>
          </div>
        </form>
      </div>
    </main>
  )
}
