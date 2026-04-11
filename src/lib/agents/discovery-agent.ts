/**
 * Discovery agent : trouve des URLs d'articles depuis les sources et intérêts de l'utilisateur.
 * Utilise le web_search tool d'Anthropic pour chercher du contenu récent.
 * Retourne une liste d'URLs dedupliquées, sans les URLs déjà connues en base.
 */
import Anthropic from '@anthropic-ai/sdk'
import type { UserProfile } from './types'

const MODEL = 'claude-haiku-4-5-20251001'
const MAX_SEARCHES = 6
const MAX_URLS_PER_RUN = 20

// Sources de qualite utilisees quand l'utilisateur n'en a pas pinne (< 2)
const DEFAULT_SOURCES_FR = [
  'lemonde.fr',
  'liberation.fr',
  'theconversation.com',
  'usbeketrica.com',
  'wired.com',
]
const DEFAULT_SOURCES_EN = [
  'wired.com',
  'technologyreview.com',
  'theverge.com',
  'arstechnica.com',
  'stratechery.com',
]
const DEFAULT_SOURCES_BOTH = [
  'theconversation.com',
  'wired.com',
  'lemonde.fr',
  'technologyreview.com',
  'usbeketrica.com',
]

type DiscoveryResult = {
  urls: string[]
  durationMs: number
  error: string | null
}

/**
 * Construit les requêtes de recherche depuis le profil utilisateur.
 * On croise les intérêts avec les sources pinned pour cibler les articles.
 */
export function buildSearchQueries(profile: UserProfile): string[] {
  const { interests, pinnedSources, profileText, profileStructured } = profile

  // Preference de langue : fr, en, ou both (defaut)
  const language = (profileStructured as Record<string, unknown> | null)?.language as
    | string
    | undefined
  const langSuffix =
    language === 'fr'
      ? ' actualite analyse français'
      : language === 'en'
        ? ' analysis insight english'
        : ''

  // Termes de recherche : intérêts + profil texte
  const topics =
    interests.length > 0
      ? interests.slice(0, 4)
      : profileText
        ? [profileText.slice(0, 80)]
        : ['intelligence artificielle', 'technologie', 'product management']

  // Sources effectives : pinnees par l'utilisateur, ou sources par defaut si < 2 pinnees
  const effectiveSources =
    pinnedSources.length >= 2
      ? pinnedSources
      : language === 'fr'
        ? DEFAULT_SOURCES_FR
        : language === 'en'
          ? DEFAULT_SOURCES_EN
          : DEFAULT_SOURCES_BOTH

  const queries: string[] = []

  // Requêtes ciblées par source (on prend les 3 premières sources effectives)
  for (const source of effectiveSources.slice(0, 3)) {
    const domain = source
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
      .replace(/^www\./, '')
    queries.push(`site:${domain} ${topics[0] ?? 'article récent'}`)
  }

  // Requêtes thématiques sans source imposée (pour la diversité)
  for (const topic of topics.slice(0, MAX_SEARCHES - queries.length)) {
    queries.push(`${topic} article analyse 2024 2025 -top10 -listicle${langSuffix}`)
  }

  return queries.slice(0, MAX_SEARCHES)
}

/**
 * Extrait les URLs HTTP(S) depuis une chaîne de texte.
 */
function extractUrls(text: string): string[] {
  const pattern = /https?:\/\/[^\s"'<>)]+/g
  const found = text.match(pattern) ?? []
  return found
    .map((u) => u.replace(/[.,;)]+$/, '')) // nettoie les ponctuation de fin
    .filter((u) => {
      try {
        const parsed = new URL(u)
        // Filtre les URLs trop courtes (homepages) et les images/PDFs
        return parsed.pathname.length > 3 && !/\.(jpg|png|gif|pdf|svg|ico)$/i.test(u)
      } catch {
        return false
      }
    })
}

export async function runDiscoveryAgent(
  profile: UserProfile,
  alreadyKnownUrls: string[] = []
): Promise<DiscoveryResult> {
  const start = Date.now()

  if (!process.env.ANTHROPIC_API_KEY) {
    return { urls: [], durationMs: 0, error: 'ANTHROPIC_API_KEY manquant' }
  }

  const client = new Anthropic()
  const queries = buildSearchQueries(profile)
  const knownSet = new Set(alreadyKnownUrls)
  const discovered = new Set<string>()

  let error: string | null = null

  try {
    // On lance toutes les recherches avec web_search en parallèle
    const results = await Promise.allSettled(
      queries.map((query) =>
        client.messages.create({
          model: MODEL,
          max_tokens: 1024,
          tools: [
            {
              type: 'web_search_20250305' as const,
              name: 'web_search',
              max_uses: 2,
            },
          ],
          messages: [
            {
              role: 'user',
              content: `Trouve 3 à 5 articles récents et substantiels sur : "${query}".
Réponds UNIQUEMENT avec une liste d'URLs complètes, une par ligne, sans texte supplémentaire.
Exemple :
https://example.com/article-1
https://example.com/article-2`,
            },
          ],
        })
      )
    )

    for (const result of results) {
      if (result.status === 'rejected') continue

      const message = result.value
      // Extraire le texte de la réponse (blocs text uniquement)
      for (const block of message.content) {
        if (block.type === 'text') {
          const urls = extractUrls(block.text)
          for (const url of urls) {
            if (!knownSet.has(url) && discovered.size < MAX_URLS_PER_RUN) {
              discovered.add(url)
            }
          }
        }
      }
    }
  } catch (err) {
    error = err instanceof Error ? err.message : String(err)
  }

  return {
    urls: Array.from(discovered),
    durationMs: Date.now() - start,
    error,
  }
}
