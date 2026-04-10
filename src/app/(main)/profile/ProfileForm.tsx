'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { updateProfile } from './actions'

const SECTORS = [
  'Consulting', 'Design', 'Developpement', 'Finance', 'Ingenierie',
  'Journalisme', 'Marketing', 'Medecine', 'Produit', 'Recherche', 'Droit', 'Autre',
]

type ProfileData = {
  profile_text: string | null
  sector: string | null
  interests: string[]
  pinned_sources: string[]
  daily_cap: number
  serendipity_quota: number
  show_scores: boolean
}

type Props = { profile: ProfileData }

export function ProfileForm({ profile }: Props) {
  const [profileText, setProfileText] = useState(profile.profile_text ?? '')
  const [sector, setSector] = useState(profile.sector ?? '')
  const [interests, setInterests] = useState(profile.interests.join(', '))
  const [sources, setSources] = useState(profile.pinned_sources.join(', '))
  const [dailyCap, setDailyCap] = useState(profile.daily_cap)
  const [serendipityQuota, setSerendipityQuota] = useState(profile.serendipity_quota)
  const [showScores, setShowScores] = useState(profile.show_scores)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaved(false)
    startTransition(async () => {
      await updateProfile({
        profile_text: profileText || undefined,
        sector: sector || undefined,
        interests: interests.split(',').map((s) => s.trim()).filter(Boolean),
        pinned_sources: sources.split(',').map((s) => s.trim()).filter(Boolean),
        daily_cap: dailyCap,
        serendipity_quota: serendipityQuota,
        show_scores: showScores,
      })
      setSaved(true)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="profile-text" className="font-[family-name:var(--font-geist)] text-sm">
          {"Centres d'interet"}
        </Label>
        <Textarea
          id="profile-text"
          placeholder="Decrivez ce qui vous interesse..."
          value={profileText}
          onChange={(e) => setProfileText(e.target.value)}
          rows={3}
          disabled={isPending}
          data-testid="profile-text"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="sector" className="font-[family-name:var(--font-geist)] text-sm">
          Secteur
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

      <div className="space-y-2">
        <Label htmlFor="interests" className="font-[family-name:var(--font-geist)] text-sm">
          Mots-cles <span className="text-muted-foreground">(separes par des virgules)</span>
        </Label>
        <Input
          id="interests"
          placeholder="machine learning, produit, geopolitique..."
          value={interests}
          onChange={(e) => setInterests(e.target.value)}
          disabled={isPending}
          data-testid="interests-input"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="sources" className="font-[family-name:var(--font-geist)] text-sm">
          Sources preferees <span className="text-muted-foreground">(separees par des virgules)</span>
        </Label>
        <Input
          id="sources"
          placeholder="lemonde.fr, paulgraham.com..."
          value={sources}
          onChange={(e) => setSources(e.target.value)}
          disabled={isPending}
          data-testid="sources-input"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="daily-cap" className="font-[family-name:var(--font-geist)] text-sm">
            Articles par jour
          </Label>
          <select
            id="daily-cap"
            value={dailyCap}
            onChange={(e) => setDailyCap(Number(e.target.value))}
            disabled={isPending}
            data-testid="daily-cap-select"
            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm font-[family-name:var(--font-geist)] text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {[5, 10, 20, 30].map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="serendipity" className="font-[family-name:var(--font-geist)] text-sm">
            Serendipite
          </Label>
          <select
            id="serendipity"
            value={serendipityQuota}
            onChange={(e) => setSerendipityQuota(Number(e.target.value))}
            disabled={isPending}
            data-testid="serendipity-select"
            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm font-[family-name:var(--font-geist)] text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {[0, 0.15, 0.30, 0.50].map((v) => (
              <option key={v} value={v}>{Math.round(v * 100)}%</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input
          id="show-scores"
          type="checkbox"
          checked={showScores}
          onChange={(e) => setShowScores(e.target.checked)}
          disabled={isPending}
          data-testid="show-scores-toggle"
          className="h-4 w-4 rounded border-input accent-primary"
        />
        <Label htmlFor="show-scores" className="font-[family-name:var(--font-geist)] text-sm cursor-pointer">
          Afficher les scores de pertinence
        </Label>
      </div>

      <div className="flex items-center gap-4 pt-2">
        <Button type="submit" disabled={isPending} data-testid="save-profile">
          {isPending ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
        {saved && (
          <span className="font-[family-name:var(--font-geist)] text-sm text-muted-foreground">
            Profil mis a jour.
          </span>
        )}
      </div>
    </form>
  )
}
