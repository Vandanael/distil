import { parseHTML } from 'linkedom'

/**
 * Strip HTML tags and decode all entities using DOM parsing.
 * More robust than regex-based stripping - handles all HTML entities correctly.
 */
export function stripHtml(html: string): string {
  if (!html) return ''
  // linkedom >=0.18 exige un document complet ; le wrap <body> seul produit un body vide.
  const { document } = parseHTML(`<!doctype html><html><body>${html}</body></html>`)
  return (document.body?.textContent ?? '').replace(/\s+/g, ' ').trim()
}

/**
 * Decode les entites HTML (&nbsp;, &amp;, &#039;, &rsquo;, &eacute;...) sans supprimer
 * le texte. Sert aux titres/excerpts qui peuvent remonter encodes depuis RSS ou Readability.
 * Early return si pas d'entite detectee pour eviter l'overhead parseHTML.
 */
export function decodeHtmlEntities(text: string): string {
  if (!text || !text.includes('&')) return text
  const { document } = parseHTML('<!doctype html><html><body></body></html>')
  const div = document.createElement('div')
  div.innerHTML = text
  return (div.textContent ?? text).trim()
}
