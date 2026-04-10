import { NextResponse } from 'next/server'
import { parseUrl } from '@/lib/parsing/readability'

export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Non disponible en production' }, { status: 404 })
  }

  const body: unknown = await request.json()
  if (
    typeof body !== 'object' ||
    body === null ||
    typeof (body as Record<string, unknown>).url !== 'string'
  ) {
    return NextResponse.json({ error: '{ url: string } attendu' }, { status: 400 })
  }

  const url = (body as { url: string }).url

  try {
    const parsed = await parseUrl(url)
    return NextResponse.json({
      url: parsed.url,
      title: parsed.title,
      author: parsed.author,
      siteName: parsed.siteName,
      publishedAt: parsed.publishedAt,
      wordCount: parsed.wordCount,
      readingTimeMinutes: parsed.readingTimeMinutes,
      excerpt: parsed.excerpt,
      contentPreview: parsed.contentText.slice(0, 500),
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 422 })
  }
}
