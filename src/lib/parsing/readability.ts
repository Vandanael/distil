import { Readability } from '@mozilla/readability'
import { JSDOM } from 'jsdom'
import DOMPurify from 'isomorphic-dompurify'
import { fetchHtml } from './fetcher'

const ALLOWED_TAGS = [
  'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'a', 'img', 'ul', 'ol', 'li', 'blockquote',
  'pre', 'code', 'em', 'strong', 'br', 'hr',
  'figure', 'figcaption', 'picture', 'source',
  'table', 'thead', 'tbody', 'tr', 'td', 'th',
  'span', 'div', 'section', 'article',
  'sup', 'sub', 'abbr', 'cite', 'mark', 'del', 'ins',
  'dl', 'dt', 'dd', 'details', 'summary',
]

const ALLOWED_ATTR = ['href', 'src', 'alt', 'title', 'class', 'id', 'srcset', 'sizes', 'type', 'media']

export type ParsedArticle = {
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
  const dom = new JSDOM(html, { url })
  const reader = new Readability(dom.window.document)
  const article = reader.parse()

  if (!article) {
    throw new Error(`Readability could not parse ${url}`)
  }

  const contentText = article.textContent?.trim() ?? ''
  const wordCount = contentText.split(/\s+/).filter(Boolean).length
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE))

  const ogImageUrl =
    dom.window.document
      .querySelector('meta[property="og:image:secure_url"]')
      ?.getAttribute('content') ??
    dom.window.document
      .querySelector('meta[property="og:image"]')
      ?.getAttribute('content') ??
    dom.window.document
      .querySelector('meta[name="twitter:image"]')
      ?.getAttribute('content') ??
    null

  return {
    url,
    title: article.title ?? null,
    author: article.byline ?? null,
    siteName: article.siteName ?? null,
    publishedAt: article.publishedTime ?? null,
    contentHtml: DOMPurify.sanitize(article.content ?? '', {
      ALLOWED_TAGS,
      ALLOWED_ATTR,
    }),
    contentText,
    excerpt: article.excerpt ?? null,
    wordCount,
    readingTimeMinutes,
    ogImageUrl,
  }
}
