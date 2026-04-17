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
  it('extrait le titre', async () => {
    const result = await parseHtml(MINIMAL_HTML, 'https://example.com/article')
    expect(result.title).toBeTruthy()
  })

  it('extrait le contenu texte', async () => {
    const result = await parseHtml(MINIMAL_HTML, 'https://example.com/article')
    expect(result.contentText.length).toBeGreaterThan(10)
  })

  it('calcule le word count', async () => {
    const result = await parseHtml(MINIMAL_HTML, 'https://example.com/article')
    expect(result.wordCount).toBeGreaterThan(0)
  })

  it('calcule le temps de lecture minimum a 1 minute', async () => {
    const result = await parseHtml(MINIMAL_HTML, 'https://example.com/article')
    expect(result.readingTimeMinutes).toBeGreaterThanOrEqual(1)
  })

  it('calcule un temps de lecture coherent pour un long article', async () => {
    const result = await parseHtml(RICH_HTML, 'https://example.com/long')
    // 300 x "Contenu " = ~600 mots -> 3 minutes environ
    expect(result.readingTimeMinutes).toBeGreaterThanOrEqual(2)
  })

  it('preserves lurl dans le resultat', async () => {
    const url = 'https://example.com/article'
    const result = await parseHtml(MINIMAL_HTML, url)
    expect(result.url).toBe(url)
  })

  it('retourne contentHtml non vide', async () => {
    const result = await parseHtml(MINIMAL_HTML, 'https://example.com/article')
    expect(result.contentHtml.length).toBeGreaterThan(0)
  })

  it('promeut data-src vers src pour les images lazy-loaded', async () => {
    const html = `<!DOCTYPE html><html><head><title>T</title></head><body>
      <article>
        <h1>Titre</h1>
        <p>${'Texte de contexte '.repeat(60)}</p>
        <img src="data:image/gif;base64,R0lGODlh" data-src="https://cdn.example.com/real.jpg" alt="photo">
        <p>${'Plus de texte '.repeat(60)}</p>
      </article>
    </body></html>`
    const result = await parseHtml(html, 'https://example.com/article')
    expect(result.contentHtml).toContain('https://cdn.example.com/real.jpg')
  })

  it('conserve les iframe YouTube (hostname allowlistes)', async () => {
    const html = `<!DOCTYPE html><html><head><title>T</title></head><body>
      <article>
        <h1>Video</h1>
        <p>${'Contexte '.repeat(60)}</p>
        <iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" width="560" height="315" allowfullscreen></iframe>
        <p>${'Suite '.repeat(60)}</p>
      </article>
    </body></html>`
    const result = await parseHtml(html, 'https://example.com/video')
    expect(result.contentHtml).toContain('youtube.com/embed/dQw4w9WgXcQ')
  })

  it('supprime les iframe hors allowlist', async () => {
    const html = `<!DOCTYPE html><html><head><title>T</title></head><body>
      <article>
        <h1>Suspect</h1>
        <p>${'Contexte '.repeat(60)}</p>
        <iframe src="https://evil.example.com/tracker"></iframe>
        <p>${'Suite '.repeat(60)}</p>
      </article>
    </body></html>`
    const result = await parseHtml(html, 'https://example.com/suspect')
    expect(result.contentHtml).not.toContain('evil.example.com')
  })
})
