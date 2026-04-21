'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { TagInput } from '@/components/forms/TagInput'
import { URLList } from '@/components/forms/URLList'
import { OPMLImportButton } from '@/components/forms/OPMLImportButton'
import { useLocale } from '@/lib/i18n/context'
import { normalizeKeyword } from '@/lib/keywords'
import { createProfile } from './actions'

type Language = 'fr' | 'en' | 'both'

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

const PROFILE_TEXT_MAX = 1000
const SOURCES_MAX = 50

export function OnboardingForm() {
  const { t } = useLocale()
  const [sources, setSources] = useState<string[]>([])
  const [profileText, setProfileText] = useState('')
  const [keywords, setKeywords] = useState<string[]>([])
  const [language, setLanguage] = useState<Language>('fr')
  const [isPending, startTransition] = useTransition()

  const canSubmit = keywords.length > 0 || profileText.trim().length > 0

  function mergeSources(incoming: string[]) {
    const seen = new Set(sources)
    const merged = [...sources]
    for (const url of incoming) {
      if (!seen.has(url) && merged.length < SOURCES_MAX) {
        merged.push(url)
        seen.add(url)
      }
    }
    setSources(merged)
  }

  function toggleSuggestion(tag: string) {
    const normalized = normalizeKeyword(tag)
    if (keywords.includes(normalized)) {
      setKeywords(keywords.filter((k) => k !== normalized))
    } else {
      setKeywords([...keywords, normalized])
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const normalized = Array.from(
      new Set(keywords.map(normalizeKeyword).filter(Boolean))
    )
    // Compose profile_text depuis les tags si l'utilisateur n'a rien saisi,
    // pour que le générateur d'embedding ait une base minimale.
    const composedText =
      profileText.trim().length > 0
        ? profileText.trim()
        : normalized.length > 0
          ? normalized.join(', ')
          : undefined

    startTransition(async () => {
      await createProfile({
        method: 'express',
        profile_text: composedText,
        interests: normalized,
        pinned_sources: sources,
        language,
      })
    })
  }

  const labelClass = 'font-ui text-sm uppercase tracking-wider text-muted-foreground'
  const hintClass = 'font-body text-sm text-muted-foreground'

  const langChipClass = (active: boolean) =>
    `font-ui text-sm px-4 py-2 border transition-colors ${
      active
        ? 'border-accent bg-accent text-background'
        : 'border-border text-muted-foreground hover:border-accent hover:text-foreground'
    }`

  const suggestionClass = (active: boolean) =>
    `font-ui text-sm px-3 py-1.5 border transition-colors ${
      active
        ? 'border-accent bg-accent text-background'
        : 'border-border text-foreground hover:border-accent'
    }`

  const charCount = profileText.length
  const charCountColor =
    charCount > PROFILE_TEXT_MAX * 0.9
      ? 'text-destructive'
      : charCount > PROFILE_TEXT_MAX * 0.75
        ? 'text-accent'
        : 'text-muted-foreground'

  return (
    <main className="flex min-h-full flex-col items-center justify-center p-8 bg-background">
      <div className="w-full max-w-lg space-y-10">
        <div className="space-y-4">
          <p className="font-ui text-sm uppercase tracking-wider text-accent">
            {t.onboarding.kicker}
          </p>
          <h1 className="font-heading text-4xl md:text-5xl leading-[1.1] tracking-tight text-foreground">
            {t.onboarding.title}
          </h1>
          <p className="font-body text-base text-muted-foreground">{t.onboarding.subtitle}</p>
          <div className="h-px bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 1. Centres d'intérêt */}
          <div className="space-y-2">
            <Label htmlFor="profile-text" className={labelClass}>
              {t.onboarding.sectionInterests}
            </Label>
            <p className={hintClass}>{t.onboarding.sectionInterestsHint}</p>
            <Textarea
              id="profile-text"
              placeholder={t.onboarding.sectionInterestsPlaceholder}
              value={profileText}
              onChange={(e) => setProfileText(e.target.value.slice(0, PROFILE_TEXT_MAX))}
              rows={10}
              disabled={isPending}
              data-testid="profile-text"
              className="min-h-[15rem] resize-y"
            />
            <div className="flex justify-end">
              <span className={`font-ui text-sm ${charCountColor}`}>
                {charCount} / {PROFILE_TEXT_MAX}
              </span>
            </div>
          </div>

          {/* 2. Mots-clés */}
          <div className="space-y-3">
            <Label htmlFor="keywords" className={labelClass}>
              {t.onboarding.sectionKeywords}
            </Label>
            <p className={hintClass}>{t.onboarding.sectionKeywordsHint}</p>
            <TagInput
              id="keywords"
              value={keywords}
              onChange={setKeywords}
              disabled={isPending}
              data-testid="keywords-taginput"
            />
            <div className="space-y-2 pt-1">
              <span className="font-ui text-sm text-muted-foreground">
                {t.onboarding.suggestionsLabel}
              </span>
              <div className="flex flex-wrap gap-2" data-testid="suggestions">
                {MAINSTREAM_INTERESTS.map((theme) => {
                  const active = keywords.includes(normalizeKeyword(theme))
                  return (
                    <button
                      key={theme}
                      type="button"
                      onClick={() => toggleSuggestion(theme)}
                      aria-pressed={active}
                      className={suggestionClass(active)}
                      data-testid={`suggestion-${theme}`}
                    >
                      {theme}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* 3. Sources préférées */}
          <div className="space-y-3">
            <Label className={labelClass}>{t.onboarding.sectionSources}</Label>
            <p className={hintClass}>{t.onboarding.sectionSourcesHint}</p>
            <OPMLImportButton
              onImport={(urls) => mergeSources(urls)}
              disabled={isPending}
              data-testid="sources-opml"
            />
            <URLList
              value={sources}
              onChange={setSources}
              maxUrls={SOURCES_MAX}
              showCounter
              disabled={isPending}
              data-testid="sources-urllist"
            />
          </div>

          {/* 4. Langue */}
          <div className="space-y-3">
            <Label className={labelClass}>{t.onboarding.sectionLanguage}</Label>
            <div className="flex flex-wrap gap-2" data-testid="language-selector">
              <button
                type="button"
                onClick={() => setLanguage('fr')}
                className={langChipClass(language === 'fr')}
                data-testid="lang-fr"
              >
                {t.onboarding.langFr}
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={langChipClass(language === 'en')}
                data-testid="lang-en"
              >
                {t.onboarding.langEn}
              </button>
              <button
                type="button"
                onClick={() => setLanguage('both')}
                className={langChipClass(language === 'both')}
                data-testid="lang-both"
              >
                {t.onboarding.langBoth}
              </button>
            </div>
            <p className={hintClass}>
              {language === 'fr' && t.onboarding.langFrHint}
              {language === 'en' && t.onboarding.langEnHint}
              {language === 'both' && t.onboarding.langBothHint}
            </p>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              className="w-full h-11"
              disabled={isPending || !canSubmit}
              data-testid="submit-onboarding"
            >
              {isPending ? t.onboarding.submitting : t.onboarding.submit}
            </Button>
          </div>
        </form>
      </div>
    </main>
  )
}
