import { describe, it, expect } from 'vitest'
import { parseHtml } from './readability'

const MINIMAL_HTML = `<!DOCTYPE html>
<html>
<head><title>Test Article</title></head>
<body>
  <article>
    <h1>Mon titre</h1>
    <p>Premier paragraphe avec du contenu.</p>
    <p>Deuxieme paragraphe avec encore plus de contenu pour avoir un vrai texte.</p>
  </article>
</body>
</html>`

const RICH_HTML = `<!DOCTYPE html>
<html>
<head>
  <title>Article Riche</title>
  <meta name="author" content="Auteur Test">
</head>
<body>
  <article>
    <h1>Titre Principal</h1>
    <p class="byline">Par Auteur Test</p>
    <p>${'Contenu '.repeat(300)}</p>
  </article>
</body>
</html>`

describe('parseHtml', () => {
  it('extrait le titre', () => {
    const result = parseHtml(MINIMAL_HTML, 'https://example.com/article')
    expect(result.title).toBeTruthy()
  })

  it('extrait le contenu texte', () => {
    const result = parseHtml(MINIMAL_HTML, 'https://example.com/article')
    expect(result.contentText.length).toBeGreaterThan(10)
  })

  it('calcule le word count', () => {
    const result = parseHtml(MINIMAL_HTML, 'https://example.com/article')
    expect(result.wordCount).toBeGreaterThan(0)
  })

  it('calcule le temps de lecture minimum a 1 minute', () => {
    const result = parseHtml(MINIMAL_HTML, 'https://example.com/article')
    expect(result.readingTimeMinutes).toBeGreaterThanOrEqual(1)
  })

  it('calcule un temps de lecture coherent pour un long article', () => {
    const result = parseHtml(RICH_HTML, 'https://example.com/long')
    // 300 x "Contenu " = ~600 mots -> 3 minutes environ
    expect(result.readingTimeMinutes).toBeGreaterThanOrEqual(2)
  })

  it('preserves lurl dans le resultat', () => {
    const url = 'https://example.com/article'
    const result = parseHtml(MINIMAL_HTML, url)
    expect(result.url).toBe(url)
  })

  it('retourne contentHtml non vide', () => {
    const result = parseHtml(MINIMAL_HTML, 'https://example.com/article')
    expect(result.contentHtml.length).toBeGreaterThan(0)
  })
})
