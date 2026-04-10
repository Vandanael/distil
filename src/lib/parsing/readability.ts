import { Readability } from '@mozilla/readability'
import { JSDOM } from 'jsdom'
import { fetchHtml } from './fetcher'

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

  return {
    url,
    title: article.title ?? null,
    author: article.byline ?? null,
    siteName: article.siteName ?? null,
    publishedAt: article.publishedTime ?? null,
    contentHtml: article.content ?? '',
    contentText,
    excerpt: article.excerpt ?? null,
    wordCount,
    readingTimeMinutes,
  }
}
