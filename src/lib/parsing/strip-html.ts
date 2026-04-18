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
