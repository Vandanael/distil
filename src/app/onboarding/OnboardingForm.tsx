'use client'

import { useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { parseOPML, OPML_MAX_URLS } from '@/lib/opml'
import { createProfile } from './actions'

type Language = 'fr' | 'en' | 'both'

// Themes grand public, volontairement larges. Chaque chip alimente interests[]
// et profile_text si l'utilisateur ne saisit rien en texte libre.
const MAINSTREAM_INTERESTS = [
  'voyage',
  'sport',
  'cinéma',
  'cuisine',
  'santé',
  'finance',
  'jardinage',
  'musique',
  'littérature',
  'photographie',
  'écologie',
  'sciences',
  'histoire',
] as const

export function OnboardingForm() {
  const [language, setLanguage] = useState<Language>('fr')
  const [selectedThemes, setSelectedThemes] = useState<string[]>([])
  const [profileText, setProfileText] = useState('')
  const [sources, setSources] = useState<string[]>([])
  const [sourceDraft, setSourceDraft] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const canSubmit = selectedThemes.length > 0 || profileText.trim().length > 0

  function toggleTheme(theme: string) {
    setSelectedThemes((prev) =>
      prev.includes(theme) ? prev.filter((t) => t !== theme) : [...prev, theme]
    )
  }

  function commitSourceDraft(value: string) {
    const parts = value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    if (parts.length === 0) return
    const next = [...sources]
    for (const p of parts) {
      if (!next.includes(p)) next.push(p)
    }
    setSources(next)
    setSourceDraft('')
  }

  function removeSource(url: string) {
    setSources(sources.filter((s) => s !== url))
  }

  function handleSourceKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      commitSourceDraft(sourceDraft)
    }
  }

  function handleOPML(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result
      if (typeof text !== 'string') return
      let urls: string[]
      try {
        urls = parseOPML(text)
      } catch {
        toast.error('Fichier OPML invalide')
        return
      }
      if (urls.length === 0) {
        toast.error('Aucune source RSS trouvée dans ce fichier')
        return
      }
      const truncated = urls.length > OPML_MAX_URLS
      const urlsToImport = truncated ? urls.slice(0, OPML_MAX_URLS) : urls
      if (truncated) {
        toast.warning(`${urls.length} sources trouvées - tronquées à ${OPML_MAX_URLS}`)
      }
      const merged = [...sources]
      for (const u of urlsToImport) {
        if (!merged.includes(u)) merged.push(u)
      }
      setSources(merged)
      toast.success(`${urlsToImport.length} source(s) ajoutée(s)`)
    }
    reader.onerror = () => toast.error('Erreur de lecture du fichier')
    reader.readAsText(file)
    e.target.value = ''
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    commitSourceDraft(sourceDraft)
    // Compose profile_text depuis les chips si l'utilisateur n'a rien tapé,
    // pour que le generateur d'embedding ait une base minimale.
    const composedText =
      profileText.trim().length > 0
        ? profileText.trim()
        : selectedThemes.length > 0
          ? selectedThemes.join(', ')
          : undefined

    startTransition(async () => {
      await createProfile({
        method: 'express',
        profile_text: composedText,
        interests: selectedThemes,
        pinned_sources: sources,
        language,
      })
    })
  }

  const langChipClass = (active: boolean) =>
    `font-ui text-sm px-4 py-2 border transition-colors ${
      active
        ? 'border-accent bg-accent text-background'
        : 'border-border text-muted-foreground hover:border-accent hover:text-foreground'
    }`

  const themeChipClass = (active: boolean) =>
    `font-ui text-sm px-3 py-1.5 border transition-colors ${
      active
        ? 'border-accent bg-accent text-background'
        : 'border-border text-foreground hover:border-accent'
    }`

  return (
    <main className="flex min-h-full flex-col items-center justify-center p-8 bg-background">
      <div className="w-full max-w-lg space-y-10">
        <div className="space-y-4">
          <p className="font-ui text-sm uppercase tracking-wider text-accent">
            Bienvenue dans Distil
          </p>
          <h1 className="font-heading text-4xl md:text-5xl leading-[1.1] tracking-tight text-foreground">
            Votre veille en deux minutes
          </h1>
          <p className="font-body text-base text-muted-foreground">
            Choisissez votre langue, vos thèmes. Distil s&apos;occupe du reste.
          </p>
          <div className="h-px bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-3">
            <Label className="font-ui text-sm uppercase tracking-wider text-muted-foreground">
              Langue des articles
            </Label>
            <div className="flex flex-wrap gap-2" data-testid="language-selector">
              <button
                type="button"
                onClick={() => setLanguage('fr')}
                className={langChipClass(language === 'fr')}
                data-testid="lang-fr"
              >
                Francophone
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={langChipClass(language === 'en')}
                data-testid="lang-en"
              >
                Anglophone
              </button>
              <button
                type="button"
                onClick={() => setLanguage('both')}
                className={langChipClass(language === 'both')}
                data-testid="lang-both"
              >
                Mixte
              </button>
            </div>
            <p className="font-body text-sm text-muted-foreground">
              {language === 'fr' && 'Priorité aux sources francophones (90% du feed).'}
              {language === 'en' && 'Priorité aux sources anglophones (90% du feed).'}
              {language === 'both' && 'Aucun biais : tout est servi indifféremment.'}
            </p>
          </div>

          <div className="space-y-3">
            <Label className="font-ui text-sm uppercase tracking-wider text-muted-foreground">
              Thèmes qui vous intéressent
            </Label>
            <div className="flex flex-wrap gap-2" data-testid="themes-selector">
              {MAINSTREAM_INTERESTS.map((theme) => {
                const active = selectedThemes.includes(theme)
                return (
                  <button
                    key={theme}
                    type="button"
                    onClick={() => toggleTheme(theme)}
                    aria-pressed={active}
                    className={themeChipClass(active)}
                    data-testid={`theme-${theme}`}
                  >
                    {theme}
                  </button>
                )
              })}
            </div>
            <p className="font-body text-sm text-muted-foreground">
              Sélectionnez autant de thèmes que vous voulez, ou décrivez-vous en texte libre ci-dessous.
            </p>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="profile-text"
              className="font-ui text-sm uppercase tracking-wider text-muted-foreground"
            >
              {"Précisez (optionnel)"}
            </Label>
            <Textarea
              id="profile-text"
              placeholder="Ex: passionné de jazz, je grimpe en montagne, je cuisine asiatique, fan de F1..."
              value={profileText}
              onChange={(e) => setProfileText(e.target.value)}
              rows={3}
              disabled={isPending}
              data-testid="profile-text"
            />
            <p className="font-body text-sm text-muted-foreground">
              Plus vous êtes précis, plus le feed est pertinent.
            </p>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="source-input"
              className="font-ui text-sm uppercase tracking-wider text-muted-foreground"
            >
              Sources préférées{' '}
              <span className="lowercase text-muted-foreground/70">(optionnel)</span>
            </Label>
            <div className="flex gap-2">
              <Input
                id="source-input"
                placeholder="lemonde.fr, paulgraham.com..."
                value={sourceDraft}
                onChange={(e) => setSourceDraft(e.target.value)}
                onKeyDown={handleSourceKeyDown}
                onBlur={() => commitSourceDraft(sourceDraft)}
                disabled={isPending}
                data-testid="source-input"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => commitSourceDraft(sourceDraft)}
                disabled={!sourceDraft.trim() || isPending}
              >
                Ajouter
              </Button>
            </div>

            {sources.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1" data-testid="sources-list">
                {sources.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-muted text-sm font-ui text-foreground"
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

            <div className="pt-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".opml,.xml,text/x-opml,application/xml,text/xml"
                onChange={handleOPML}
                className="sr-only"
                aria-label="Importer un fichier OPML"
                id="opml-file-input"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isPending}
                className="font-ui text-sm text-muted-foreground hover:text-accent transition-colors disabled:opacity-40"
                data-testid="opml-import-btn"
              >
                ou importer un fichier OPML
              </button>
              {fileName && (
                <span className="ml-2 font-body text-sm text-muted-foreground">{fileName}</span>
              )}
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              className="w-full h-11"
              disabled={isPending || !canSubmit}
              data-testid="submit-onboarding"
            >
              {isPending ? 'Création du profil...' : 'Démarrer Distil'}
            </Button>
          </div>
        </form>
      </div>
    </main>
  )
}
