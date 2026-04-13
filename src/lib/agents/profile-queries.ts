/**
 * Fonctions de présentation du profil utilisateur.
 * Pas de dépendance jsdom - importable depuis les Server Components.
 */
import type { UserProfile } from './types'

const DEFAULT_SOURCES_EN = [
  'hacker news',
  'wired.com',
  'technologyreview.com',
  'simonwillison.net',
  'theguardian.com',
  'newyorker.com',
  'theatlantic.com',
]

const DEFAULT_SOURCES_FR = [
  'lemonde.fr',
  'theconversation.com',
  'usbeketrica.com',
  'numerama.com',
  'slate.fr',
  'liberation.fr',
  'courrier-international.com',
]

const DEFAULT_SOURCES_BOTH = [
  'hacker news',
  'lemonde.fr',
  'theconversation.com',
  'wired.com',
  'newyorker.com',
  'theatlantic.com',
  'courrier-international.com',
]

function normalizeDomain(source: string): string {
  return source
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '')
    .trim()
}

export function buildSearchQueries(profile: UserProfile): string[] {
  const language = (profile.profileStructured as Record<string, unknown> | null)
    ?.language as string | undefined

  const effectiveSources =
    profile.pinnedSources.length >= 2
      ? profile.pinnedSources
      : language === 'fr'
        ? DEFAULT_SOURCES_FR
        : language === 'en'
          ? DEFAULT_SOURCES_EN
          : DEFAULT_SOURCES_BOTH

  const lines: string[] = []
  for (const s of effectiveSources.slice(0, 5)) {
    lines.push(`RSS ${normalizeDomain(s)}`)
  }
  for (const topic of profile.interests.slice(0, 3)) {
    lines.push(`Sujet : ${topic}`)
  }
  return lines
}
