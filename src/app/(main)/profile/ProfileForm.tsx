'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { splitInterestsFromCsv } from '@/lib/keywords'
import { updateProfile } from './actions'

type ProfileData = {
  profile_text: string | null
  interests: string[]
  pinned_sources: string[]
  language?: 'fr' | 'en' | 'both'
}

type Props = { profile: ProfileData }

export function ProfileForm({ profile }: Props) {
  const [profileText, setProfileText] = useState(profile.profile_text ?? '')
  const [interests, setInterests] = useState(profile.interests.join(', '))
  const [sources, setSources] = useState(profile.pinned_sources.join(', '))
  const [language, setLanguage] = useState<'fr' | 'en' | 'both'>(profile.language ?? 'both')
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [sourcesSavedHint, setSourcesSavedHint] = useState(false)
  const [isPending, startTransition] = useTransition()

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
          interests: splitInterestsFromCsv(interests),
          pinned_sources: newSources,
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

  const labelClass = 'font-ui text-sm text-muted-foreground'

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
          <p className="font-ui text-sm text-muted-foreground">
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
    </form>
  )
}
