/**
 * Discovery agent : trouve des URLs d'articles via flux RSS.
 * Zero coût API.
 */
import type { UserProfile } from './types'
export { buildSearchQueries } from './profile-queries'

const MAX_URLS_PER_RUN = 30

export const RSS_MAP: Record<string, string> = {

  // === TECH GÉNÉRALISTE ===
  'wired.com':                      'https://www.wired.com/feed/rss',
  'technologyreview.com':           'https://www.technologyreview.com/feed/',
  'theverge.com':                   'https://www.theverge.com/rss/index.xml',
  'arstechnica.com':                'https://feeds.arstechnica.com/arstechnica/index',
  'techcrunch.com':                 'https://techcrunch.com/feed/',
  'hackernoon.com':                 'https://hackernoon.com/feed',
  'spectrum.ieee.org':              'https://spectrum.ieee.org/feeds/feed.rss',
  'zdnet.com':                      'https://www.zdnet.com/news/rss.xml',
  'venturebeat.com':                'https://venturebeat.com/feed/',

  // === DEV / ENGINEERING ===
  'hacker news':                    'https://news.ycombinator.com/rss',
  'hn':                             'https://news.ycombinator.com/rss',
  'lobste.rs':                      'https://lobste.rs/rss',
  'dev.to':                         'https://dev.to/feed',
  'github.blog':                    'https://github.blog/feed/',
  'infoq.com':                      'https://feed.infoq.com/',
  'martinfowler.com':               'https://martinfowler.com/feed.atom',
  'simonwillison.net':              'https://simonwillison.net/atom/everything/',
  'danluu.com':                     'https://danluu.com/atom.xml',
  'jvns.ca':                        'https://jvns.ca/atom.xml',
  'overreacted.io':                 'https://overreacted.io/rss.xml',
  'lethain.com':                    'https://lethain.com/feeds/',
  'css-tricks.com':                 'https://css-tricks.com/feed/',
  'smashingmagazine.com':           'https://www.smashingmagazine.com/feed/',

  // === PRODUIT / STRATÉGIE ===
  'stratechery.com':                'https://stratechery.com/feed/',
  'ben-evans.com':                  'https://www.ben-evans.com/benedictevans/rss.xml',
  'pragmaticengineer.com':          'https://newsletter.pragmaticengineer.com/feed',
  'hbr.org':                        'https://feeds.hbr.org/harvardbusiness',
  'firstround.com':                 'https://review.firstround.com/feed.xml',
  'a16z.com':                       'https://a16z.com/feed/',
  'inc.com':                        'https://www.inc.com/rss/',
  'fastcompany.com':                'https://www.fastcompany.com/latest/rss',

  // === IA / RECHERCHE ===
  'anthropic.com':                  'https://www.anthropic.com/rss.xml',
  'openai.com':                     'https://openai.com/news/rss.xml',
  'deepmind.com':                   'https://deepmind.google/blog/rss.xml',
  'blog.google':                    'https://blog.google/rss/',
  'research.ibm.com':               'https://research.ibm.com/blog/rss',
  'arxiv.org/cs.AI':                'https://arxiv.org/rss/cs.AI',
  'arxiv.org/cs.LG':                'https://arxiv.org/rss/cs.LG',
  'arxiv.org/cs.CV':                'https://arxiv.org/rss/cs.CV',
  'huggingface.co':                 'https://huggingface.co/blog/feed.xml',
  'ai.googleblog.com':              'https://blog.research.google/feeds/posts/default',

  // === ENGINEERING À GRANDE ÉCHELLE ===
  'netflixtechblog.com':            'https://netflixtechblog.com/feed',
  'engineering.fb.com':             'https://engineering.fb.com/feed/',
  'engineering.atspotify.com':      'https://engineering.atspotify.com/feed/',
  'eng.uber.com':                   'https://www.uber.com/en-US/blog/engineering/rss/',
  'queue.acm.org':                  'https://queue.acm.org/rss/feeds/queuecontent.xml',
  'dropbox.tech':                   'https://dropbox.tech/feed',
  'slack.engineering':              'https://slack.engineering/feed/',

  // === SCIENCE & RECHERCHE ===
  'quantamagazine.org':             'https://www.quantamagazine.org/feed/',
  'newscientist.com':               'https://www.newscientist.com/feed/home/',
  'nature.com':                     'https://www.nature.com/news.rss',
  'mit.edu':                        'https://news.mit.edu/rss/research',
  'scientificamerican.com':         'https://rss.sciam.com/ScientificAmerican-Global',
  'sciencedaily.com':               'https://www.sciencedaily.com/rss/top/science.xml',
  'phys.org':                       'https://phys.org/rss-feed/',
  'pourlascience.fr':               'https://www.pourlascience.fr/flux-rss/',
  'arxiv.org/q-bio':                'https://arxiv.org/rss/q-bio',
  'pnas.org':                       'https://www.pnas.org/action/showFeed?type=etoc&feed=rss&jc=pnas',
  'health.harvard.edu':             'https://www.health.harvard.edu/blog/feed',

  // === POLITIQUE & MONDE ===
  'reuters.com':                    'https://feeds.reuters.com/reuters/topNews',
  'theguardian.com':                'https://www.theguardian.com/world/rss',
  'foreignpolicy.com':              'https://foreignpolicy.com/feed/',
  'foreignaffairs.com':             'https://www.foreignaffairs.com/rss.xml',
  'politico.eu':                    'https://www.politico.eu/feed/',
  'politico.com':                   'https://www.politico.com/rss/politics08.xml',
  'euractiv.com':                   'https://www.euractiv.com/feed/',
  'brookings.edu':                  'https://www.brookings.edu/feed/',
  'bbc.com':                        'https://feeds.bbci.co.uk/news/world/rss.xml',
  'aljazeera.com':                  'https://www.aljazeera.com/xml/rss/all.xml',
  'lemonde.fr':                     'https://www.lemonde.fr/rss/une.xml',
  'courrier-international.com':     'https://www.courrierinternational.com/feed/all/rss.xml',
  'monde-diplomatique.fr':          'https://www.monde-diplomatique.fr/rss/',
  'slate.fr':                       'https://www.slate.fr/rss.xml',
  'rfi.fr':                         'https://www.rfi.fr/fr/rss',
  'lefigaro.fr':                    'https://www.lefigaro.fr/rss/figaro_actualites.xml',
  'mediapart.fr':                   'https://www.mediapart.fr/articles/feed',
  'theatlantic.com':                'https://www.theatlantic.com/feed/all/',
  'nytimes.com':                    'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
  'nytimes.com/tech':               'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml',
  'nytimes.com/science':            'https://rss.nytimes.com/services/xml/rss/nyt/Science.xml',
  'nytimes.com/arts':               'https://rss.nytimes.com/services/xml/rss/nyt/Arts.xml',
  'nytimes.com/sports':             'https://rss.nytimes.com/services/xml/rss/nyt/Sports.xml',
  'economist.com':                  'https://www.economist.com/finance-and-economics/rss.xml',
  'liberation.fr':                  'https://www.liberation.fr/arc/outboundfeeds/rss/?outputType=xml',

  // === ÉCONOMIE & BUSINESS ===
  'lesechos.fr':                    'https://www.lesechos.fr/rss/rss_une.xml',
  'alternatives-economiques.fr':    'https://www.alternatives-economiques.fr/feed',
  'ft.com':                         'https://www.ft.com/rss/home',

  // === CUISINE & GASTRONOMIE ===
  'seriouseats.com':                'https://www.seriouseats.com/feeds/all',
  'eater.com':                      'https://www.eater.com/rss/index.xml',
  'bonappetit.com':                 'https://www.bonappetit.com/feed/rss',
  'food52.com':                     'https://food52.com/blog.rss',
  'davidlebovitz.com':              'https://www.davidlebovitz.com/feed/',
  '101cookbooks.com':               'https://www.101cookbooks.com/feed',
  'smittenkitchen.com':             'https://smittenkitchen.com/feed/',
  'thekitchn.com':                  'https://www.thekitchn.com/main/feed',
  'finedininglovers.com':           'https://www.finedininglovers.com/rss',
  'epicurious.com':                 'https://www.epicurious.com/feed/recipes-and-cooking',

  // === SPORT & BIEN-ÊTRE ===
  'lequipe.fr':                     'https://www.lequipe.fr/rss/actu_rss.xml',
  'runnersworld.com':               'https://www.runnersworld.com/feed/all',
  'outsideonline.com':              'https://www.outsideonline.com/feed/',
  'bicycling.com':                  'https://www.bicycling.com/feed/all',
  'menshealth.com':                 'https://www.menshealth.com/feed/all',
  'womenshealthmag.com':            'https://www.womenshealthmag.com/feed/all',
  'mindful.org':                    'https://www.mindful.org/feed/',
  'psychologytoday.com':            'https://www.psychologytoday.com/us/front-page/feed',

  // === CULTURE & SOCIÉTÉ ===
  'newyorker.com':                  'https://www.newyorker.com/feed/everything',
  'pitchfork.com':                  'https://pitchfork.com/rss/news/',
  'rollingstone.com':               'https://www.rollingstone.com/feed/',
  'telerama.fr':                    'https://www.telerama.fr/rss.xml',
  'konbini.com':                    'https://www.konbini.com/feed/',
  'dezeen.com':                     'https://www.dezeen.com/feed/',
  'resident-advisor.net':           'https://ra.co/xml/news.xml',
  'mixmag.net':                     'https://mixmag.net/feed',
  'artforum.com':                   'https://www.artforum.com/feed/',
  'theconversation.com':            'https://theconversation.com/fr/articles.atom',
  'usbeketrica.com':                'https://usbeketrica.com/feed',
  'numerama.com':                   'https://www.numerama.com/feed/',

  // === DESIGN & CRÉATIVITÉ ===
  'uxdesign.cc':                    'https://uxdesign.cc/feed',
  'creativebloq.com':               'https://www.creativebloq.com/feeds/all',
  'designboom.com':                 'https://www.designboom.com/feed/',
  'abduzeedo.com':                  'https://abduzeedo.com/feed/',

  // === ESSAIS / LONG READS ===
  'astralcodexten.com':             'https://www.astralcodexten.com/feed',
  '80000hours.org':                 'https://80000hours.org/feed/',
  'lesswrong.com':                  'https://www.lesswrong.com/feed.xml',
  'paulgraham.com':                 'http://www.paulgraham.com/rss.html',
  'waitbutwhy.com':                 'https://waitbutwhy.com/feed',
  'aeon.co':                        'https://aeon.co/feed.rss',
  'nautil.us':                      'https://nautil.us/feed/',
  'longreads.com':                  'https://longreads.com/feed/',
  'themarkup.org':                  'https://themarkup.org/feeds/rss.xml',
  'propublica.org':                 'https://feeds.propublica.org/propublica/main',
}

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

