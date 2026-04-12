/**
 * Discovery agent : trouve des URLs d'articles via flux RSS.
 * Zero coût API.
 */
import { JSDOM } from 'jsdom'
import type { UserProfile } from './types'

const MAX_URLS_PER_RUN = 30

export const RSS_MAP: Record<string, string> = {
  // Tech généraliste
  'wired.com':                    'https://www.wired.com/feed/rss',
  'technologyreview.com':         'https://www.technologyreview.com/feed/',
  'theverge.com':                 'https://www.theverge.com/rss/index.xml',
  'arstechnica.com':              'https://feeds.arstechnica.com/arstechnica/index',
  'techcrunch.com':               'https://techcrunch.com/feed/',
  'hackernoon.com':               'https://hackernoon.com/feed',
  'spectrum.ieee.org':            'https://spectrum.ieee.org/feeds/feed.rss',

  // Dev / engineering
  'hacker news':                  'https://news.ycombinator.com/rss',
  'hn':                           'https://news.ycombinator.com/rss',
  'lobste.rs':                    'https://lobste.rs/rss',
  'dev.to':                       'https://dev.to/feed',
  'github.blog':                  'https://github.blog/feed/',
  'infoq.com':                    'https://feed.infoq.com/',
  'martinfowler.com':             'https://martinfowler.com/feed.atom',
  'simonwillison.net':            'https://simonwillison.net/atom/everything/',
  'danluu.com':                   'https://danluu.com/atom.xml',
  'jvns.ca':                      'https://jvns.ca/atom.xml',
  'overreacted.io':               'https://overreacted.io/rss.xml',
  'lethain.com':                  'https://lethain.com/feeds/',

  // Produit / stratégie
  'stratechery.com':              'https://stratechery.com/feed/',
  'ben-evans.com':                'https://www.ben-evans.com/benedictevans/rss.xml',
  'pragmaticengineer.com':        'https://newsletter.pragmaticengineer.com/feed',
  'hbr.org':                      'https://feeds.hbr.org/harvardbusiness',

  // IA / recherche
  'anthropic.com':                'https://www.anthropic.com/rss.xml',
  'openai.com':                   'https://openai.com/news/rss.xml',
  'deepmind.com':                 'https://deepmind.google/blog/rss.xml',
  'blog.google':                  'https://blog.google/rss/',
  'research.ibm.com':             'https://research.ibm.com/blog/rss',
  'arxiv.org/cs.AI':              'https://arxiv.org/rss/cs.AI',
  'arxiv.org/cs.LG':              'https://arxiv.org/rss/cs.LG',

  // Engineering à grande échelle
  'netflixtechblog.com':          'https://netflixtechblog.com/feed',
  'engineering.fb.com':           'https://engineering.fb.com/feed/',
  'engineering.atspotify.com':    'https://engineering.atspotify.com/feed/',
  'eng.uber.com':                 'https://www.uber.com/en-US/blog/engineering/rss/',
  'queue.acm.org':                'https://queue.acm.org/rss/feeds/queuecontent.xml',

  // Science / society
  'quantamagazine.org':           'https://www.quantamagazine.org/feed/',
  'newscientist.com':             'https://www.newscientist.com/feed/home/',
  'nature.com':                   'https://www.nature.com/news.rss',
  'mit.edu':                      'https://news.mit.edu/rss/research',
  'brookings.edu':                'https://www.brookings.edu/feed/',
  'foreignaffairs.com':           'https://www.foreignaffairs.com/rss.xml',
  'theatlantic.com':              'https://www.theatlantic.com/feed/all/',
  'nytimes.com':                  'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml',
  'economist.com':                'https://www.economist.com/finance-and-economics/rss.xml',

  // Essais / long reads
  'astralcodexten.com':           'https://www.astralcodexten.com/feed',
  '80000hours.org':               'https://80000hours.org/feed/',
  'lesswrong.com':                'https://www.lesswrong.com/feed.xml',
  'paulgraham.com':               'http://www.paulgraham.com/rss.html',
  'waitbutwhy.com':               'https://waitbutwhy.com/feed',

  // FR (garde les meilleures)
  'lemonde.fr':                   'https://www.lemonde.fr/rss/une.xml',
  'theconversation.com':          'https://theconversation.com/fr/articles.atom',
  'usbeketrica.com':              'https://usbeketrica.com/feed',
  'liberation.fr':                'https://www.liberation.fr/arc/outboundfeeds/rss/?outputType=xml',
  'numerama.com':                 'https://www.numerama.com/feed/',
}

const DEFAULT_SOURCES_EN = [
  'hacker news',
  'wired.com',
  'technologyreview.com',
  'simonwillison.net',
  'theverge.com',
]

const DEFAULT_SOURCES_FR = [
  'lemonde.fr',
  'theconversation.com',
  'usbeketrica.com',
  'numerama.com',
  'hacker news',
]

const DEFAULT_SOURCES_BOTH = [
  'hacker news',
  'wired.com',
  'theconversation.com',
  'technologyreview.com',
  'lemonde.fr',
]

type DiscoveryResult = {
  urls: string[]
  durationMs: number
  error: string | null
}

function normalizeDomain(source: string): string {
  return source
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '')
    .trim()
}

function getRssFeedUrls(source: string): string[] {
  const key = source.toLowerCase().trim()
  if (RSS_MAP[key]) return [RSS_MAP[key]]

  const domain = normalizeDomain(source)
  if (RSS_MAP[domain]) return [RSS_MAP[domain]]

  return [
    `https://${domain}/feed`,
    `https://${domain}/rss.xml`,
    `https://${domain}/feed.xml`,
    `https://www.${domain}/feed`,
  ]
}

async function fetchRssUrls(feedUrl: string): Promise<string[]> {
  try {
    const res = await fetch(feedUrl, {
      headers: { 'User-Agent': 'Distil/1.0 RSS reader' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return []

    const xml = await res.text()
    const dom = new JSDOM(xml, { contentType: 'text/xml' })
    const doc = dom.window.document
    const urls: string[] = []

    for (const item of doc.querySelectorAll('item')) {
      const url = item.querySelector('link')?.textContent?.trim()
      if (url) urls.push(url)
    }

    for (const entry of doc.querySelectorAll('entry')) {
      const url = entry.querySelector('link[href]')?.getAttribute('href')
      if (url) urls.push(url)
    }

    return urls.filter((u) => {
      try {
        const { pathname } = new URL(u)
        return pathname.length > 3 && !/\.(jpg|png|gif|pdf|svg|ico|webp)$/i.test(u)
      } catch {
        return false
      }
    })
  } catch {
    return []
  }
}

async function fetchSourceUrls(source: string): Promise<string[]> {
  for (const feedUrl of getRssFeedUrls(source)) {
    const urls = await fetchRssUrls(feedUrl)
    if (urls.length > 0) return urls
  }
  return []
}

export async function runDiscoveryAgent(
  profile: UserProfile,
  alreadyKnownUrls: string[] = []
): Promise<DiscoveryResult> {
  const start = Date.now()

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

  // Serendipity : 2 sources hors profil
  const pinnedNormalized = profile.pinnedSources.map(normalizeDomain)
  const serendipitySources = (language === 'fr' ? DEFAULT_SOURCES_FR : DEFAULT_SOURCES_EN)
    .filter((s) => !pinnedNormalized.includes(normalizeDomain(s)))
    .slice(0, 2)

  const allSources = [...new Set([...effectiveSources, ...serendipitySources])]

  const knownSet = new Set(alreadyKnownUrls)
  const discovered = new Set<string>()
  let error: string | null = null

  try {
    const results = await Promise.allSettled(allSources.map(fetchSourceUrls))
    for (const result of results) {
      if (result.status === 'rejected') continue
      for (const url of result.value) {
        if (!knownSet.has(url) && discovered.size < MAX_URLS_PER_RUN) {
          discovered.add(url)
        }
      }
    }
  } catch (err) {
    error = err instanceof Error ? err.message : String(err)
  }

  return { urls: Array.from(discovered), durationMs: Date.now() - start, error }
}

/**
 * Retourne les sources et sujets suivis (affichage profil).
 */
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
