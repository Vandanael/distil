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
import { updateProfile } from './actions'
import { DiscoveryToggle } from './DiscoveryToggle'

type ProfileData = {
  profile_text: string | null
  interests: string[]
  pinned_sources: string[]
  language?: 'fr' | 'en' | 'both'
  discovery_mode: 'active' | 'sources_first'
}

type Props = { profile: ProfileData }

const PROFILE_TEXT_MAX = 1000
const SOURCES_MAX = 50

export function ProfileForm({ profile }: Props) {
  const { t } = useLocale()
  const [sources, setSources] = useState<string[]>(profile.pinned_sources)
  const [profileText, setProfileText] = useState(profile.profile_text ?? '')
  const [keywords, setKeywords] = useState<string[]>(profile.interests)
  const [language, setLanguage] = useState<'fr' | 'en' | 'both'>(profile.language ?? 'both')
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [sourcesSavedHint, setSourcesSavedHint] = useState(false)
  const [isPending, startTransition] = useTransition()

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

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaved(false)
    setSaveError(null)
    setSourcesSavedHint(false)
    const sourcesChanged = sources.join(',') !== profile.pinned_sources.join(',')
    const normalizedKeywords = Array.from(new Set(keywords.map(normalizeKeyword).filter(Boolean)))
    startTransition(async () => {
      try {
        await updateProfile({
          profile_text: profileText || undefined,
          interests: normalizedKeywords,
          pinned_sources: sources,
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
  const hintClass = 'font-body text-sm text-muted-foreground'

  const charCount = profileText.length
  const charCountColor =
    charCount > PROFILE_TEXT_MAX * 0.9
      ? 'text-destructive'
      : charCount > PROFILE_TEXT_MAX * 0.75
        ? 'text-accent'
        : 'text-muted-foreground'

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* 1. Centres d'intérêt */}
      <section className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="profile-text" className={labelClass}>
            {t.profile.sectionInterests}
          </Label>
          <p className={hintClass}>{t.profile.sectionInterestsHint}</p>
        </div>
        <Textarea
          id="profile-text"
          placeholder={t.profile.sectionInterestsPlaceholder}
          value={profileText}
          onChange={(e) => setProfileText(e.target.value.slice(0, PROFILE_TEXT_MAX))}
          rows={10}
          disabled={isPending}
          data-testid="profile-text"
          className="min-h-[15rem] resize-y"
        />
        <div className="flex justify-end">
          <span className={`font-ui text-sm ${charCountColor}`}>
            {charCount} / {PROFILE_TEXT_MAX} {t.profile.charCount}
          </span>
        </div>
      </section>

      {/* 2. Mots-clés */}
      <section className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="keywords" className={labelClass}>
            {t.profile.sectionKeywords}
          </Label>
          <p className={hintClass}>{t.profile.sectionKeywordsHint}</p>
        </div>
        <TagInput
          id="keywords"
          value={keywords}
          onChange={setKeywords}
          disabled={isPending}
          data-testid="keywords-taginput"
        />
      </section>

      {/* 3. Sources préférées */}
      <section className="space-y-3">
        <div className="space-y-1">
          <Label className={labelClass}>{t.profile.sectionSources}</Label>
          <p className={hintClass}>{t.profile.sectionSourcesHint}</p>
        </div>
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
        {sourcesSavedHint && <p className={hintClass}>{t.profile.sourcesSavedHint}</p>}
      </section>

      {/* 4. Decouverte : toggle autonome (sauvegarde immediate, independante du submit) */}
      <DiscoveryToggle mode={profile.discovery_mode} />

      {/* 5. Langue */}
      <section className="space-y-3">
        <Label htmlFor="language" className={labelClass}>
          {t.profile.sectionLanguage}
        </Label>
        <select
          id="language"
          value={language}
          onChange={(e) => setLanguage(e.target.value as 'fr' | 'en' | 'both')}
          disabled={isPending}
          data-testid="language-select"
          className={selectClass}
        >
          <option value="both">{t.profile.langBoth}</option>
          <option value="fr">{t.profile.langFr}</option>
          <option value="en">{t.profile.langEn}</option>
        </select>
      </section>

      <div className="flex items-center gap-4 pt-2">
        <Button type="submit" disabled={isPending} data-testid="save-profile">
          {isPending ? t.profile.saving : t.profile.save}
        </Button>
        {saved && <span className="font-ui text-sm text-muted-foreground">{t.profile.saved}</span>}
        {saveError && (
          <p role="alert" className="font-ui text-sm text-destructive">
            {saveError}
          </p>
        )}
      </div>
    </form>
  )
}
