/**
 * GET /api/export/notes
 * Exporte toutes les notes de l'utilisateur en Markdown compatible Obsidian.
 * Une section par article, avec les highlights associes et les notes.
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })
  }

  // Charger les notes avec article, highlight et tags associes
  const { data: notes } = await supabase
    .from('notes')
    .select(
      `
      content,
      created_at,
      articles (id, title, url, site_name, author, published_at, article_tags (tags (name))),
      highlights (text_content)
    `
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (!notes || notes.length === 0) {
    const empty = `# Notes Distil\n\nAucune note pour l'instant.\n`
    return new NextResponse(empty, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': 'attachment; filename="distil-notes.md"',
      },
    })
  }

  // Regrouper par article
  type ArticleGroup = {
    title: string | null
    url: string
    siteName: string | null
    author: string | null
    publishedAt: string | null
    tags: string[]
    entries: Array<{ note: string; highlight: string | null; date: string }>
  }

  const byArticle = new Map<string, ArticleGroup>()

  for (const n of notes) {
    const article = Array.isArray(n.articles) ? n.articles[0] : n.articles
    if (!article) continue
    const highlight = Array.isArray(n.highlights) ? (n.highlights[0] ?? null) : n.highlights

    const articleTags = (article as Record<string, unknown>).article_tags as Array<{
      tags: { name: string } | null
    }> | null
    const tagNames = (articleTags ?? [])
      .map((at) => at.tags?.name)
      .filter((name): name is string => Boolean(name))

    const key = article.id
    if (!byArticle.has(key)) {
      byArticle.set(key, {
        title: article.title,
        url: article.url,
        siteName: article.site_name,
        author: article.author,
        publishedAt: article.published_at,
        tags: tagNames,
        entries: [],
      })
    }

    byArticle.get(key)!.entries.push({
      note: n.content,
      highlight: highlight?.text_content ?? null,
      date: n.created_at,
    })
  }

  // Construire un index tag -> titres pour les backlinks
  const tagToTitles = new Map<string, string[]>()
  for (const [, art] of byArticle) {
    const title = art.title ?? 'Sans titre'
    for (const tag of art.tags) {
      const existing = tagToTitles.get(tag) ?? []
      existing.push(title)
      tagToTitles.set(tag, existing)
    }
  }

  // Construire le Markdown
  const exportDate = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const exportDateIso = new Date().toISOString().slice(0, 10)

  const lines: string[] = [
    '---',
    `date: ${exportDateIso}`,
    'source: Distil',
    'tags:',
    '  - distil',
    '  - notes',
    '---',
    '',
    `# Notes Distil - ${exportDate}`,
    '',
  ]

  for (const [, art] of byArticle) {
    const title = art.title ?? 'Sans titre'
    lines.push(`## [[${title}]]`)
    lines.push('')

    if (art.tags.length > 0) {
      lines.push(`Tags : ${art.tags.map((t) => `#${t.replace(/\s+/g, '-')}`).join(' ')}`)
      lines.push('')
    }
    if (art.author) lines.push(`Auteur : ${art.author}`)
    if (art.siteName) lines.push(`Source : ${art.siteName}`)
    if (art.publishedAt) lines.push(`Publie le : ${formatDate(art.publishedAt)}`)
    lines.push(`URL : ${art.url}`)
    lines.push('')

    for (const entry of art.entries) {
      if (entry.highlight) {
        lines.push(`> ${entry.highlight}`)
        lines.push('')
      }
      lines.push(entry.note)
      lines.push('')
      lines.push(`*Note du ${formatDate(entry.date)}*`)
      lines.push('')
      lines.push('---')
      lines.push('')
    }

    // Backlinks via tags partages
    const related = new Set<string>()
    for (const tag of art.tags) {
      for (const other of tagToTitles.get(tag) ?? []) {
        if (other !== title) related.add(other)
      }
    }
    if (related.size > 0) {
      lines.push(`Voir aussi : ${[...related].map((r) => `[[${r}]]`).join(', ')}`)
      lines.push('')
    }
  }

  const markdown = lines.join('\n')

  return new NextResponse(markdown, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="distil-notes-${new Date().toISOString().slice(0, 10)}.md"`,
    },
  })
}
