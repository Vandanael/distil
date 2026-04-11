/**
 * GET /api/export/notes
 * Exporte toutes les notes de l'utilisateur en Markdown compatible Obsidian.
 * Une section par article, avec les highlights associes et les notes.
 */
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Supabase non configure' }, { status: 503 })
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        for (const { name, value, options } of toSet) {
          cookieStore.set(name, value, options)
        }
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })
  }

  // Charger les notes avec article et highlight associes
  const { data: notes } = await supabase
    .from('notes')
    .select(
      `
      content,
      created_at,
      articles (id, title, url, site_name, author, published_at),
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
  const byArticle = new Map<
    string,
    {
      title: string | null
      url: string
      siteName: string | null
      author: string | null
      publishedAt: string | null
      entries: Array<{ note: string; highlight: string | null; date: string }>
    }
  >()

  for (const n of notes) {
    const article = Array.isArray(n.articles) ? n.articles[0] : n.articles
    if (!article) continue
    const highlight = Array.isArray(n.highlights) ? (n.highlights[0] ?? null) : n.highlights

    const key = article.id
    if (!byArticle.has(key)) {
      byArticle.set(key, {
        title: article.title,
        url: article.url,
        siteName: article.site_name,
        author: article.author,
        publishedAt: article.published_at,
        entries: [],
      })
    }

    byArticle.get(key)!.entries.push({
      note: n.content,
      highlight: highlight?.text_content ?? null,
      date: n.created_at,
    })
  }

  // Construire le Markdown
  const exportDate = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const lines: string[] = [`# Notes Distil — ${exportDate}`, '']

  for (const [, art] of byArticle) {
    lines.push(`## ${art.title ?? 'Sans titre'}`)
    lines.push('')

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
  }

  const markdown = lines.join('\n')

  return new NextResponse(markdown, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="distil-notes-${new Date().toISOString().slice(0, 10)}.md"`,
    },
  })
}
