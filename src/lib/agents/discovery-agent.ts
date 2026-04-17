/**
 * Discovery agent : trouve des URLs d'articles via flux RSS.
 * Zero coût API.
 *
 * Principe editorial : le flux matinal doit couvrir 2+ sujets de qualite differents,
 * jamais mono-thematique. On categorise les sources, on deduit les categories voulues
 * depuis le profil, et on impose un plafond par categorie pendant la selection.
 */
import type { UserProfile } from './types'

const MAX_URLS_PER_RUN = 30
// Plafond par categorie (40 % du budget) : empeche qu'une seule thematique
// (typiquement HN qui renvoie 30+ URLs) sature tout le flux matinal.
const MAX_PER_CATEGORY = Math.ceil(MAX_URLS_PER_RUN * 0.4)
// Nombre de sources retenues par categorie active (rotation journaliere).
const SOURCES_PER_CATEGORY = 3

type Category =
  | 'tech'
  | 'dev'
  | 'produit'
  | 'ia'
  | 'eng_scale'
  | 'science'
  | 'politique'
  | 'economie'
  | 'cuisine'
  | 'sport'
  | 'culture'
  | 'design'
  | 'essais'

const SOURCES_BY_CATEGORY: Record<Category, Record<string, string>> = {
  tech: {
    'wired.com': 'https://www.wired.com/feed/rss',
    'technologyreview.com': 'https://www.technologyreview.com/feed/',
    'theverge.com': 'https://www.theverge.com/rss/index.xml',
    'arstechnica.com': 'https://feeds.arstechnica.com/arstechnica/index',
    'techcrunch.com': 'https://techcrunch.com/feed/',
    'hackernoon.com': 'https://hackernoon.com/feed',
    'spectrum.ieee.org': 'https://spectrum.ieee.org/feeds/feed.rss',
    'zdnet.com': 'https://www.zdnet.com/news/rss.xml',
    'venturebeat.com': 'https://venturebeat.com/feed/',
    'numerama.com': 'https://www.numerama.com/feed/',
  },
  dev: {
    'hacker news': 'https://news.ycombinator.com/rss',
    hn: 'https://news.ycombinator.com/rss',
    'lobste.rs': 'https://lobste.rs/rss',
    'dev.to': 'https://dev.to/feed',
    'github.blog': 'https://github.blog/feed/',
    'infoq.com': 'https://feed.infoq.com/',
    'martinfowler.com': 'https://martinfowler.com/feed.atom',
    'simonwillison.net': 'https://simonwillison.net/atom/everything/',
    'danluu.com': 'https://danluu.com/atom.xml',
    'jvns.ca': 'https://jvns.ca/atom.xml',
    'overreacted.io': 'https://overreacted.io/rss.xml',
    'lethain.com': 'https://lethain.com/feeds/',
    'css-tricks.com': 'https://css-tricks.com/feed/',
    'smashingmagazine.com': 'https://www.smashingmagazine.com/feed/',
  },
  produit: {
    'stratechery.com': 'https://stratechery.com/feed/',
    'ben-evans.com': 'https://www.ben-evans.com/benedictevans/rss.xml',
    'pragmaticengineer.com': 'https://newsletter.pragmaticengineer.com/feed',
    'hbr.org': 'https://feeds.hbr.org/harvardbusiness',
    'firstround.com': 'https://review.firstround.com/feed.xml',
    'a16z.com': 'https://a16z.com/feed/',
    'inc.com': 'https://www.inc.com/rss/',
    'fastcompany.com': 'https://www.fastcompany.com/latest/rss',
  },
  ia: {
    'anthropic.com': 'https://www.anthropic.com/rss.xml',
    'openai.com': 'https://openai.com/news/rss.xml',
    'deepmind.com': 'https://deepmind.google/blog/rss.xml',
    'blog.google': 'https://blog.google/rss/',
    'research.ibm.com': 'https://research.ibm.com/blog/rss',
    'arxiv.org/cs.AI': 'https://arxiv.org/rss/cs.AI',
    'arxiv.org/cs.LG': 'https://arxiv.org/rss/cs.LG',
    'arxiv.org/cs.CV': 'https://arxiv.org/rss/cs.CV',
    'huggingface.co': 'https://huggingface.co/blog/feed.xml',
    'ai.googleblog.com': 'https://blog.research.google/feeds/posts/default',
  },
  eng_scale: {
    'netflixtechblog.com': 'https://netflixtechblog.com/feed',
    'engineering.fb.com': 'https://engineering.fb.com/feed/',
    'engineering.atspotify.com': 'https://engineering.atspotify.com/feed/',
    'eng.uber.com': 'https://www.uber.com/en-US/blog/engineering/rss/',
    'queue.acm.org': 'https://queue.acm.org/rss/feeds/queuecontent.xml',
    'dropbox.tech': 'https://dropbox.tech/feed',
    'slack.engineering': 'https://slack.engineering/feed/',
  },
  science: {
    'quantamagazine.org': 'https://www.quantamagazine.org/feed/',
    'newscientist.com': 'https://www.newscientist.com/feed/home/',
    'nature.com': 'https://www.nature.com/news.rss',
    'mit.edu': 'https://news.mit.edu/rss/research',
    'scientificamerican.com': 'https://rss.sciam.com/ScientificAmerican-Global',
    'sciencedaily.com': 'https://www.sciencedaily.com/rss/top/science.xml',
    'phys.org': 'https://phys.org/rss-feed/',
    'pourlascience.fr': 'https://www.pourlascience.fr/flux-rss/',
    'arxiv.org/q-bio': 'https://arxiv.org/rss/q-bio',
    'pnas.org': 'https://www.pnas.org/action/showFeed?type=etoc&feed=rss&jc=pnas',
    'health.harvard.edu': 'https://www.health.harvard.edu/blog/feed',
    'nytimes.com/science': 'https://rss.nytimes.com/services/xml/rss/nyt/Science.xml',
  },
  politique: {
    'reuters.com': 'https://feeds.reuters.com/reuters/topNews',
    'theguardian.com': 'https://www.theguardian.com/world/rss',
    'foreignpolicy.com': 'https://foreignpolicy.com/feed/',
    'foreignaffairs.com': 'https://www.foreignaffairs.com/rss.xml',
    'politico.eu': 'https://www.politico.eu/feed/',
    'politico.com': 'https://www.politico.com/rss/politics08.xml',
    'euractiv.com': 'https://www.euractiv.com/feed/',
    'brookings.edu': 'https://www.brookings.edu/feed/',
    'bbc.com': 'https://feeds.bbci.co.uk/news/world/rss.xml',
    'aljazeera.com': 'https://www.aljazeera.com/xml/rss/all.xml',
    'lemonde.fr': 'https://www.lemonde.fr/rss/une.xml',
    'courrier-international.com': 'https://www.courrierinternational.com/feed/all/rss.xml',
    'monde-diplomatique.fr': 'https://www.monde-diplomatique.fr/rss/',
    'slate.fr': 'https://www.slate.fr/rss.xml',
    'rfi.fr': 'https://www.rfi.fr/fr/rss',
    'lefigaro.fr': 'https://www.lefigaro.fr/rss/figaro_actualites.xml',
    'mediapart.fr': 'https://www.mediapart.fr/articles/feed',
    'theatlantic.com': 'https://www.theatlantic.com/feed/all/',
    'nytimes.com': 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
    'economist.com': 'https://www.economist.com/finance-and-economics/rss.xml',
    'liberation.fr': 'https://www.liberation.fr/arc/outboundfeeds/rss/?outputType=xml',
  },
  economie: {
    'lesechos.fr': 'https://www.lesechos.fr/rss/rss_une.xml',
    'alternatives-economiques.fr': 'https://www.alternatives-economiques.fr/feed',
    'ft.com': 'https://www.ft.com/rss/home',
  },
  cuisine: {
    'seriouseats.com': 'https://www.seriouseats.com/feeds/all',
    'eater.com': 'https://www.eater.com/rss/index.xml',
    'bonappetit.com': 'https://www.bonappetit.com/feed/rss',
    'food52.com': 'https://food52.com/blog.rss',
    'davidlebovitz.com': 'https://www.davidlebovitz.com/feed/',
    '101cookbooks.com': 'https://www.101cookbooks.com/feed',
    'smittenkitchen.com': 'https://smittenkitchen.com/feed/',
    'thekitchn.com': 'https://www.thekitchn.com/main/feed',
    'finedininglovers.com': 'https://www.finedininglovers.com/rss',
    'epicurious.com': 'https://www.epicurious.com/feed/recipes-and-cooking',
  },
  sport: {
    'lequipe.fr': 'https://www.lequipe.fr/rss/actu_rss.xml',
    'runnersworld.com': 'https://www.runnersworld.com/feed/all',
    'outsideonline.com': 'https://www.outsideonline.com/feed/',
    'bicycling.com': 'https://www.bicycling.com/feed/all',
    'menshealth.com': 'https://www.menshealth.com/feed/all',
    'womenshealthmag.com': 'https://www.womenshealthmag.com/feed/all',
    'mindful.org': 'https://www.mindful.org/feed/',
    'psychologytoday.com': 'https://www.psychologytoday.com/us/front-page/feed',
  },
  culture: {
    'newyorker.com': 'https://www.newyorker.com/feed/everything',
    'pitchfork.com': 'https://pitchfork.com/rss/news/',
    'rollingstone.com': 'https://www.rollingstone.com/feed/',
    'telerama.fr': 'https://www.telerama.fr/rss.xml',
    'konbini.com': 'https://www.konbini.com/feed/',
    'resident-advisor.net': 'https://ra.co/xml/news.xml',
    'mixmag.net': 'https://mixmag.net/feed',
    'artforum.com': 'https://www.artforum.com/feed/',
    'theconversation.com': 'https://theconversation.com/fr/articles.atom',
    'usbeketrica.com': 'https://usbeketrica.com/feed',
    'nytimes.com/arts': 'https://rss.nytimes.com/services/xml/rss/nyt/Arts.xml',
  },
  design: {
    'dezeen.com': 'https://www.dezeen.com/feed/',
    'uxdesign.cc': 'https://uxdesign.cc/feed',
    'creativebloq.com': 'https://www.creativebloq.com/feeds/all',
    'designboom.com': 'https://www.designboom.com/feed/',
    'abduzeedo.com': 'https://abduzeedo.com/feed/',
  },
  essais: {
    'astralcodexten.com': 'https://www.astralcodexten.com/feed',
    '80000hours.org': 'https://80000hours.org/feed/',
    'lesswrong.com': 'https://www.lesswrong.com/feed.xml',
    'paulgraham.com': 'http://www.paulgraham.com/rss.html',
    'waitbutwhy.com': 'https://waitbutwhy.com/feed',
    'aeon.co': 'https://aeon.co/feed.rss',
    'nautil.us': 'https://nautil.us/feed/',
    'longreads.com': 'https://longreads.com/feed/',
    'themarkup.org': 'https://themarkup.org/feeds/rss.xml',
    'propublica.org': 'https://feeds.propublica.org/propublica/main',
  },
}

// Mots-cles (interests + profile_text) qui activent chaque categorie.
// Tout est normalise en minuscules et sans accents avant matching.
const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  tech: ['tech', 'technologie', 'technology', 'numerique', 'digital', 'web', 'internet', 'crypto'],
  dev: [
    'dev',
    'developpeur',
    'developer',
    'code',
    'coding',
    'programming',
    'engineering',
    'software',
    'logiciel',
  ],
  produit: [
    'produit',
    'product',
    'pm',
    'product management',
    'startup',
    'strategy',
    'business',
    'management',
  ],
  ia: [
    'ia',
    'ai',
    'machine learning',
    'ml',
    'llm',
    'intelligence artificielle',
    'deep learning',
    'nlp',
  ],
  eng_scale: ['architecture', 'infrastructure', 'devops', 'sre', 'scaling', 'distributed'],
  science: [
    'science',
    'scientifique',
    'research',
    'recherche',
    'biologie',
    'biology',
    'physique',
    'physics',
    'sante',
    'health',
  ],
  politique: [
    'politique',
    'politics',
    'geopolitique',
    'geopolitics',
    'monde',
    'world',
    'international',
    'actualite',
    'news',
    'societe',
    'society',
    'infos pratiques',
  ],
  economie: ['economie', 'economics', 'economy', 'finance', 'marche', 'market'],
  cuisine: ['cuisine', 'cooking', 'food', 'gastronomie', 'gastronomy', 'recette', 'recipe'],
  sport: ['sport', 'sports', 'running', 'fitness', 'cycling', 'yoga', 'foot', 'football', 'basket'],
  culture: [
    'culture',
    'art',
    'arts',
    'musique',
    'music',
    'cinema',
    'film',
    'livre',
    'livres',
    'book',
    'books',
    'fantasy',
    'sf',
    'science fiction',
    'jeux video',
    'jeux videos',
    'games',
    'gaming',
    'video games',
    'series',
    'tv',
  ],
  design: ['design', 'ux', 'ui', 'typographie', 'typography', 'graphisme'],
  essais: [
    'essai',
    'essais',
    'essay',
    'essays',
    'philosophie',
    'philosophy',
    'longform',
    'long read',
    'lecture',
  ],
}

// Defaut si aucune categorie ne matche : 2 sujets contrastes, pas mono-thematique.
const FALLBACK_CATEGORIES_EN: Category[] = ['tech', 'politique', 'culture']
const FALLBACK_CATEGORIES_FR: Category[] = ['politique', 'culture', 'science']
const FALLBACK_CATEGORIES_BOTH: Category[] = ['tech', 'politique', 'culture']

// Construction a plat pour le lookup par source (supporte les sources pinned
// que l'utilisateur saisit en texte libre).
const FLAT_SOURCE_MAP: Record<string, string> = Object.values(SOURCES_BY_CATEGORY).reduce(
  (acc, bucket) => Object.assign(acc, bucket),
  {} as Record<string, string>
)

// Index inverse : quelle categorie contient cette cle source ?
const SOURCE_TO_CATEGORY: Record<string, Category> = {}
for (const [cat, bucket] of Object.entries(SOURCES_BY_CATEGORY) as [
  Category,
  Record<string, string>,
][]) {
  for (const key of Object.keys(bucket)) {
    if (!SOURCE_TO_CATEGORY[key]) SOURCE_TO_CATEGORY[key] = cat
  }
}

type DiscoveryResult = {
  urls: string[]
  durationMs: number
  error: string | null
}

function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function normalizeDomain(source: string): string {
  return source
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '')
    .trim()
}

export function dayOfYear(d: Date): number {
  const start = Date.UTC(d.getUTCFullYear(), 0, 0)
  const diff = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - start
  return Math.floor(diff / 86_400_000)
}

export function pickRotating<T>(pool: T[], count: number, seed: number): T[] {
  if (pool.length === 0) return []
  if (pool.length <= count) return [...pool]
  const offset = ((seed % pool.length) + pool.length) % pool.length
  const tail = pool.slice(offset, offset + count)
  const head = pool.slice(0, Math.max(0, count - tail.length))
  return [...tail, ...head]
}

export function inferCategories(profile: UserProfile): Category[] {
  const haystack = normalizeText(
    [profile.profileText ?? '', ...(profile.interests ?? []), profile.sector ?? ''].join(' ')
  )
  if (!haystack) return []

  const matched = new Set<Category>()
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS) as [Category, string[]][]) {
    for (const kw of keywords) {
      if (haystack.includes(normalizeText(kw))) {
        matched.add(cat)
        break
      }
    }
  }
  return Array.from(matched)
}

function getRssFeedUrls(source: string): string[] {
  const key = source.toLowerCase().trim()
  if (FLAT_SOURCE_MAP[key]) return [FLAT_SOURCE_MAP[key]]

  const domain = normalizeDomain(source)
  if (FLAT_SOURCE_MAP[domain]) return [FLAT_SOURCE_MAP[domain]]

  return [
    `https://${domain}/feed`,
    `https://${domain}/rss.xml`,
    `https://${domain}/feed.xml`,
    `https://www.${domain}/feed`,
  ]
}

function categoryOf(sourceKey: string): Category | 'pinned' {
  const key = sourceKey.toLowerCase().trim()
  if (SOURCE_TO_CATEGORY[key]) return SOURCE_TO_CATEGORY[key]
  const domain = normalizeDomain(sourceKey)
  if (SOURCE_TO_CATEGORY[domain]) return SOURCE_TO_CATEGORY[domain]
  return 'pinned'
}

async function fetchRssUrls(feedUrl: string): Promise<string[]> {
  try {
    const res = await fetch(feedUrl, {
      headers: { 'User-Agent': 'Distil/1.0 RSS reader' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return []

    const xml = await res.text()
    const urls: string[] = []

    // RSS 2.0 : <link>https://...</link> (hors balises CDATA channel)
    for (const m of xml.matchAll(/<item[\s\S]*?<link>([^<]+)<\/link>/g)) {
      urls.push(m[1].trim())
    }
    // Atom : <link href="https://..." />
    for (const m of xml.matchAll(/<link[^>]+href="([^"]+)"/g)) {
      urls.push(m[1].trim())
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
  const seed = dayOfYear(new Date())

  const language = (profile.profileStructured as Record<string, unknown> | null)?.language as
    | string
    | undefined

  const inferred = inferCategories(profile)
  const activeCategories: Category[] =
    inferred.length > 0
      ? inferred
      : language === 'fr'
        ? FALLBACK_CATEGORIES_FR
        : language === 'en'
          ? FALLBACK_CATEGORIES_EN
          : FALLBACK_CATEGORIES_BOTH

  // Pour chaque categorie active, on pioche N sources en rotation journaliere.
  // Variante deterministe pour que le meme jour rende les memes sources mais
  // que le lendemain diversifie automatiquement.
  const categorySources: Array<{ source: string; category: Category }> = []
  for (const cat of activeCategories) {
    const pool = Object.keys(SOURCES_BY_CATEGORY[cat])
    for (const src of pickRotating(pool, SOURCES_PER_CATEGORY, seed)) {
      categorySources.push({ source: src, category: cat })
    }
  }

  // Sources epinglees par l'utilisateur : toujours incluses, meme si
  // hors categorie active, car elles portent le signal editorial fort.
  const pinnedSources = profile.pinnedSources.map((s) => ({
    source: s,
    category: categoryOf(s),
  }))

  // Dedup en conservant l'ordre d'insertion (pinned en premier).
  const seen = new Set<string>()
  const orderedSources: Array<{ source: string; category: Category | 'pinned' }> = []
  for (const entry of [...pinnedSources, ...categorySources]) {
    const key = entry.source.toLowerCase().trim()
    if (seen.has(key)) continue
    seen.add(key)
    orderedSources.push(entry)
  }

  const knownSet = new Set(alreadyKnownUrls)
  const discovered = new Set<string>()
  const countPerCategory: Record<string, number> = {}
  let error: string | null = null

  try {
    const results = await Promise.allSettled(orderedSources.map((s) => fetchSourceUrls(s.source)))

    const perSource = results.map((r, i) => ({
      category: orderedSources[i].category,
      urls: r.status === 'fulfilled' ? r.value.filter((u) => !knownSet.has(u)) : [],
    }))

    // Round-robin avec plafond par categorie : chaque source contribue a tour
    // de role, et des qu'une categorie atteint MAX_PER_CATEGORY on la skip
    // pour laisser de la place aux autres sujets. 'pinned' echappe au plafond.
    const cursors = new Array(perSource.length).fill(0)
    let remaining = perSource.reduce((sum, b) => sum + b.urls.length, 0)

    while (discovered.size < MAX_URLS_PER_RUN && remaining > 0) {
      let advanced = false
      for (let i = 0; i < perSource.length; i++) {
        if (discovered.size >= MAX_URLS_PER_RUN) break
        const bucket = perSource[i]
        const idx = cursors[i]
        if (idx >= bucket.urls.length) continue

        const cat = bucket.category
        const catKey = cat === 'pinned' ? '__pinned' : cat
        const isCapped = cat !== 'pinned' && (countPerCategory[catKey] ?? 0) >= MAX_PER_CATEGORY

        cursors[i] = idx + 1
        remaining--
        advanced = true

        if (isCapped) continue

        const url = bucket.urls[idx]
        if (!discovered.has(url)) {
          discovered.add(url)
          countPerCategory[catKey] = (countPerCategory[catKey] ?? 0) + 1
        }
      }
      if (!advanced) break
    }
  } catch (err) {
    error = err instanceof Error ? err.message : String(err)
  }

  return { urls: Array.from(discovered), durationMs: Date.now() - start, error }
}
