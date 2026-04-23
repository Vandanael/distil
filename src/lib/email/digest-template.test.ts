import { describe, it, expect } from 'vitest'
import { buildDigestHtml, buildDigestText } from './digest-template'

const ARTICLES = [
  {
    id: 'a1',
    title: 'The future of AI',
    site_name: 'example.com',
    excerpt: 'AI is changing everything',
    score: 85,
    reading_time_minutes: 5,
  },
  {
    id: 'a2',
    title: 'Product management tips',
    site_name: 'blog.pm',
    excerpt: null,
    score: 42,
    reading_time_minutes: null,
  },
]

const DATA = {
  articles: ARTICLES,
  appUrl: 'https://distil.app',
  unsubscribeUrl: 'https://distil.app/api/digest/unsubscribe?token=abc',
  date: 'lundi 12 avril',
}

describe('buildDigestHtml', () => {
  it('contient le titre Distil', () => {
    const html = buildDigestHtml(DATA)
    expect(html).toContain('Distil')
  })

  it('contient les titres des articles', () => {
    const html = buildDigestHtml(DATA)
    expect(html).toContain('The future of AI')
    expect(html).toContain('Product management tips')
  })

  it('contient les liens vers les articles', () => {
    const html = buildDigestHtml(DATA)
    expect(html).toContain('https://distil.app/article/a1')
    expect(html).toContain('https://distil.app/article/a2')
  })

  it('contient le score en pourcentage', () => {
    const html = buildDigestHtml(DATA)
    expect(html).toContain('85%')
    expect(html).toContain('42%')
  })

  it('contient le lien de desabonnement', () => {
    const html = buildDigestHtml(DATA)
    expect(html).toContain('Se désabonner')
    expect(html).toContain('unsubscribe?token=abc')
  })

  it('contient la date', () => {
    const html = buildDigestHtml(DATA)
    expect(html).toContain('lundi 12 avril')
  })

  it('echappe le HTML dans les titres', () => {
    const data = {
      ...DATA,
      articles: [{ ...ARTICLES[0], title: '<script>alert("xss")</script>' }],
    }
    const html = buildDigestHtml(data)
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('contient le CTA ouvrir Distil', () => {
    const html = buildDigestHtml(DATA)
    expect(html).toContain('Ouvrir Distil')
    expect(html).toContain('https://distil.app/feed')
  })
})

describe('buildDigestText', () => {
  it('contient les titres en texte brut', () => {
    const text = buildDigestText(DATA)
    expect(text).toContain('The future of AI')
    expect(text).toContain('Product management tips')
  })

  it('contient les liens', () => {
    const text = buildDigestText(DATA)
    expect(text).toContain('https://distil.app/article/a1')
  })

  it('contient le lien de desabonnement', () => {
    const text = buildDigestText(DATA)
    expect(text).toContain('Se désabonner')
  })

  it('contient les scores', () => {
    const text = buildDigestText(DATA)
    expect(text).toContain('85%')
  })
})
