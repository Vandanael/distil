import { Readability } from '@mozilla/readability'
import { parseHTML } from 'linkedom'
import sanitizeHtml from 'sanitize-html'
import { fetchHtml } from './fetcher'

// Hostnames autorises pour les iframes embarques (tweets, videos, code).
// Tout iframe pointant ailleurs est supprime par sanitize-html.
const ALLOWED_IFRAME_HOSTNAMES = [
  'www.youtube.com',
  'www.youtube-nocookie.com',
  'youtube.com',
  'player.vimeo.com',
  'platform.twitter.com',
  'codepen.io',
  'codesandbox.io',
  'gist.github.com',
]

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'a',
    'img',
    'ul',
    'ol',
    'li',
    'blockquote',
    'pre',
    'code',
    'em',
    'strong',
    'br',
    'hr',
    'figure',
    'figcaption',
    'picture',
    'source',
    'table',
    'thead',
    'tbody',
    'tr',
    'td',
    'th',
    'span',
    'div',
    'section',
    'article',
    'sup',
    'sub',
    'abbr',
    'cite',
    'mark',
    'del',
    'ins',
    'dl',
    'dt',
    'dd',
    'details',
    'summary',
    'iframe',
  ],
  allowedAttributes: {
    '*': [
      'href',
      'src',
      'alt',
      'title',
      'class',
      'id',
      'srcset',
      'sizes',
      'type',
      'media',
      'target',
      'rel',
    ],
    iframe: [
      'src',
      'width',
      'height',
      'allow',
      'allowfullscreen',
      'frameborder',
      'loading',
      'title',
      'referrerpolicy',
    ],
  },
  allowedIframeHostnames: ALLOWED_IFRAME_HOSTNAMES,
  allowedSchemesByTag: {
    iframe: ['https'],
  },
  transformTags: {
    iframe: (tagName, attribs) => ({
      tagName,
      attribs: { ...attribs, loading: 'lazy', referrerpolicy: 'no-referrer' },
    }),
  },
}

// Promeut les attributs lazy-load (data-src, data-original, data-srcset) vers
// src/srcset natifs pour que sanitize-html puisse les conserver. Beaucoup de
// sites (Medium, Substack, NYT) servent un placeholder dans src et la vraie
// image dans data-src ; sans ca les images sont cassees.
const LAZY_SRC_ATTRS = ['data-src', 'data-original', 'data-lazy-src', 'data-delayed-url']
const LAZY_SRCSET_ATTRS = ['data-srcset', 'data-lazy-srcset']

function promoteLazyImages(root: Element): void {
  const imgs = root.querySelectorAll('img')
  for (const img of Array.from(imgs)) {
    for (const attr of LAZY_SRC_ATTRS) {
      const v = img.getAttribute(attr)
      if (v) {
        img.setAttribute('src', v)
        break
      }
    }
    for (const attr of LAZY_SRCSET_ATTRS) {
      const v = img.getAttribute(attr)
      if (v) {
        img.setAttribute('srcset', v)
        break
      }
    }
  }
  const sources = root.querySelectorAll('source')
  for (const source of Array.from(sources)) {
    for (const attr of LAZY_SRCSET_ATTRS) {
      const v = source.getAttribute(attr)
      if (v) {
        source.setAttribute('srcset', v)
        break
      }
    }
  }
}

type ParsedArticle = {
  url: string
  title: string | null
  author: string | null
  siteName: string | null
  publishedAt: string | null
  contentHtml: string
  contentText: string
  excerpt: string | null
  wordCount: number
  readingTimeMinutes: number
  ogImageUrl: string | null
}

const WORDS_PER_MINUTE = 238

export async function parseUrl(url: string): Promise<ParsedArticle> {
  const html = await fetchHtml(url)
  return parseHtml(html, url)
}

export function parseHtml(html: string, url: string): ParsedArticle {
  const { document } = parseHTML(html)
  // linkedom ne supporte pas location sur document - on le simule pour Readability
  Object.defineProperty(document, 'location', {
    value: { href: url },
    writable: true,
    configurable: true,
  })

  // Promeut les attributs lazy avant Readability pour qu'il conserve les images
  promoteLazyImages(document.documentElement as unknown as Element)

  const reader = new Readability(document as unknown as Document)
  const article = reader.parse()

  if (!article) {
    throw new Error(`Readability could not parse ${url}`)
  }

  const contentText = article.textContent?.trim() ?? ''
  const wordCount = contentText.split(/\s+/).filter(Boolean).length
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE))

  const ogImageUrl =
    document.querySelector('meta[property="og:image:secure_url"]')?.getAttribute('content') ??
    document.querySelector('meta[property="og:image"]')?.getAttribute('content') ??
    document.querySelector('meta[name="twitter:image"]')?.getAttribute('content') ??
    null

  return {
    url,
    title: article.title ?? null,
    author: article.byline ?? null,
    siteName: article.siteName ?? null,
    publishedAt: article.publishedTime ?? null,
    contentHtml: sanitizeHtml(article.content ?? '', SANITIZE_OPTIONS),
    contentText,
    excerpt: article.excerpt ?? null,
    wordCount,
    readingTimeMinutes,
    ogImageUrl,
  }
}
