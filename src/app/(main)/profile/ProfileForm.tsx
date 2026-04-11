'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { updateProfile } from './actions'

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

async function runScoring(urls: string[]): Promise<{ accepted: number; rejected: number }> {
  const res = await fetch('/api/scoring/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ urls }),
  })
  if (!res.ok) throw new Error('Erreur serveur')
  return res.json() as Promise<{ accepted: number; rejected: number }>
}

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
  const [showScoringPanel, setShowScoringPanel] = useState(false)
  const [scoringUrls, setScoringUrls] = useState('')
  const [isScoringPending, startScoringTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaved(false)
    startTransition(async () => {
      await updateProfile({
        profile_text: profileText || undefined,
        sector: sector || undefined,
        interests: interests
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        pinned_sources: sources
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        daily_cap: dailyCap,
        serendipity_quota: serendipityQuota,
        show_scores: showScores,
      })
      setSaved(true)
    })
  }

  const selectClass =
    'h-10 w-full border border-input bg-background px-3 font-ui text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

  const labelClass = 'font-ui text-[10px] uppercase tracking-wider text-muted-foreground'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="profile-text" className={labelClass}>
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
        <Label htmlFor="sector" className={labelClass}>
          Secteur
        </Label>
        <select
          id="sector"
          value={sector}
          onChange={(e) => setSector(e.target.value)}
          disabled={isPending}
          data-testid="sector-select"
          className={selectClass}
        >
          <option value="">-- Selectionnez --</option>
          {SECTORS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="interests" className={labelClass}>
          Mots-cles
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
        <Label htmlFor="sources" className={labelClass}>
          Sources preferees
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
          <Label htmlFor="daily-cap" className={labelClass}>
            Articles par jour
          </Label>
          <select
            id="daily-cap"
            value={dailyCap}
            onChange={(e) => setDailyCap(Number(e.target.value))}
            disabled={isPending}
            data-testid="daily-cap-select"
            className={selectClass}
          >
            {[5, 10, 20, 30].map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="serendipity" className={labelClass}>
            Serendipite
          </Label>
          <select
            id="serendipity"
            value={serendipityQuota}
            onChange={(e) => setSerendipityQuota(Number(e.target.value))}
            disabled={isPending}
            data-testid="serendipity-select"
            className={selectClass}
          >
            {[0, 0.15, 0.3, 0.5].map((v) => (
              <option key={v} value={v}>
                {Math.round(v * 100)}%
              </option>
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
          className="h-4 w-4 border-input accent-primary"
        />
        <Label htmlFor="show-scores" className="font-ui text-sm cursor-pointer">
          Afficher les scores de pertinence
        </Label>
      </div>

      <div className="flex items-center gap-4 pt-2">
        <Button type="submit" disabled={isPending} data-testid="save-profile">
          {isPending ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
        {saved && <span className="font-ui text-sm text-muted-foreground">Profil mis a jour.</span>}
      </div>

      {/* Declencheur de scoring manuel */}
      <div className="border-t border-border pt-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="font-ui text-sm font-medium text-foreground">Lancer le scoring</p>
            <p className="font-body text-xs text-muted-foreground">
              Collez des URLs d&apos;articles, Distil les analyse et les score.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowScoringPanel(!showScoringPanel)}
            data-testid="toggle-scoring-panel"
          >
            {showScoringPanel ? 'Fermer' : 'Analyser des articles'}
          </Button>
        </div>

        {showScoringPanel && (
          <div className="space-y-3 border border-border p-4">
            <Label className="font-ui text-[10px] uppercase tracking-wider text-muted-foreground">
              URLs a analyser (une par ligne)
            </Label>
            <Textarea
              placeholder={`https://example.com/article-1\nhttps://example.com/article-2`}
              value={scoringUrls}
              onChange={(e) => setScoringUrls(e.target.value)}
              rows={5}
              disabled={isScoringPending}
              data-testid="scoring-urls-input"
            />
            <Button
              type="button"
              size="sm"
              disabled={isScoringPending || !scoringUrls.trim()}
              data-testid="run-scoring-btn"
              onClick={() => {
                const urls = scoringUrls
                  .split('\n')
                  .map((u) => u.trim())
                  .filter((u) => u.startsWith('http'))
                if (urls.length === 0) {
                  toast.error('Aucune URL valide')
                  return
                }
                startScoringTransition(async () => {
                  const toastId = toast.loading(`Analyse de ${urls.length} article${urls.length > 1 ? 's' : ''}...`)
                  try {
                    const result = await runScoring(urls)
                    toast.success(
                      `${result.accepted} retenu${result.accepted > 1 ? 's' : ''}, ${result.rejected} rejet${result.rejected > 1 ? 'é' : 'é'}`,
                      { id: toastId }
                    )
                    setScoringUrls('')
                    setShowScoringPanel(false)
                  } catch {
                    toast.error('Erreur lors du scoring', { id: toastId })
                  }
                })
              }}
            >
              {isScoringPending ? 'Analyse en cours...' : 'Analyser'}
            </Button>
          </div>
        )}
      </div>
    </form>
  )
}
