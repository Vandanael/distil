'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { updateProfile } from './actions'

async function runScoring(urls: string[]): Promise<{ accepted: number; rejected: number }> {
  const res = await fetch('/api/scoring/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ urls }),
  })
  if (!res.ok) throw new Error('Erreur serveur')
  return res.json() as Promise<{ accepted: number; rejected: number }>
}

async function refreshFeed(): Promise<{
  discovered: number
  accepted: number
  rejected: number
}> {
  const res = await fetch('/api/feed/refresh', { method: 'POST' })
  if (!res.ok) throw new Error('Erreur serveur')
  return res.json() as Promise<{ discovered: number; accepted: number; rejected: number }>
}

type ProfileData = {
  profile_text: string | null
  interests: string[]
  pinned_sources: string[]
  daily_cap: number
  serendipity_quota: number
  show_scores: boolean
  language?: 'fr' | 'en' | 'both'
}

type Props = { profile: ProfileData }

export function ProfileForm({ profile }: Props) {
  const [profileText, setProfileText] = useState(profile.profile_text ?? '')
  const [interests, setInterests] = useState(profile.interests.join(', '))
  const [sources, setSources] = useState(profile.pinned_sources.join(', '))
  const [language, setLanguage] = useState<'fr' | 'en' | 'both'>(profile.language ?? 'both')
  const [dailyCap, setDailyCap] = useState(profile.daily_cap)
  const [serendipityQuota, setSerendipityQuota] = useState(profile.serendipity_quota)
  const [showScores, setShowScores] = useState(profile.show_scores)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [sourcesSavedHint, setSourcesSavedHint] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [showScoringPanel, setShowScoringPanel] = useState(false)
  const [scoringUrls, setScoringUrls] = useState('')
  const [isScoringPending, startScoringTransition] = useTransition()
  const [isRefreshPending, startRefreshTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaved(false)
    setSaveError(null)
    setSourcesSavedHint(false)
    const newSources = sources
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    const sourcesChanged = newSources.join(',') !== profile.pinned_sources.join(',')
    startTransition(async () => {
      try {
        await updateProfile({
          profile_text: profileText || undefined,
          interests: interests
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          pinned_sources: newSources,
          daily_cap: dailyCap,
          serendipity_quota: serendipityQuota,
          show_scores: showScores,
          language,
        })
        setSaved(true)
        if (sourcesChanged) setSourcesSavedHint(true)
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde.')
      }
    })
  }

  const selectClass =
    'h-10 w-full border border-input bg-background px-3 font-ui text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

  const labelClass = 'font-ui text-[13px] text-muted-foreground'

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
        {sourcesSavedHint && (
          <p className="font-ui text-xs text-muted-foreground">
            Ces sources seront incluses lors du prochain rafraîchissement.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="language" className={labelClass}>
          Langue des articles
        </Label>
        <select
          id="language"
          value={language}
          onChange={(e) => setLanguage(e.target.value as 'fr' | 'en' | 'both')}
          disabled={isPending}
          data-testid="language-select"
          className={selectClass}
        >
          <option value="both">Francais et anglais</option>
          <option value="fr">Francais uniquement</option>
          <option value="en">Anglais uniquement</option>
        </select>
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
        {saved && <span className="font-ui text-sm text-muted-foreground">Profil mis à jour.</span>}
        {saveError && (
          <p role="alert" className="font-ui text-sm text-destructive">
            {saveError}
          </p>
        )}
      </div>

      {/* Declencheur de scoring manuel */}
      <div className="border-t border-border pt-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="font-ui text-sm font-medium text-foreground">Rafraîchir le feed</p>
            <p className="font-body text-xs text-muted-foreground">
              Distil cherche de nouveaux articles depuis vos sources et centres d&apos;intérêt.
            </p>
            <p className="font-ui text-xs text-muted-foreground">
              Actualisation automatique chaque matin à 6h30.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            disabled={isRefreshPending}
            data-testid="refresh-feed-btn"
            title="Actualisation automatique chaque matin a 6h30"
            onClick={() => {
              startRefreshTransition(async () => {
                const toastId = toast.loading('Recherche de nouveaux articles...')
                try {
                  const result = await refreshFeed()
                  if (result.accepted > 0) {
                    toast.success(
                      `${result.accepted} nouvel article${result.accepted > 1 ? 's' : ''} dans votre feed`,
                      { id: toastId }
                    )
                  } else {
                    toast.info('Aucun nouvel article pertinent trouvé', { id: toastId })
                  }
                } catch {
                  toast.error('Erreur lors du rafraîchissement', { id: toastId })
                }
              })
            }}
          >
            {isRefreshPending ? 'Recherche...' : 'Rafraîchir'}
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="font-ui text-sm font-medium text-foreground">Analyser des articles</p>
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
            {showScoringPanel ? 'Fermer' : 'Coller des URLs'}
          </Button>
        </div>

        {showScoringPanel && (
          <div className="space-y-3 border border-border p-4">
            <Label className="font-ui text-[13px] text-muted-foreground">
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
                  const toastId = toast.loading(
                    `Analyse de ${urls.length} article${urls.length > 1 ? 's' : ''}...`
                  )
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
