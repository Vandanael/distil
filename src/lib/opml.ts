export const OPML_MAX_URLS = 50

/**
 * Extrait les URLs xmlUrl depuis un fichier OPML.
 * Compatible Feedly, FreshRSS, Miniflux.
 */
export function parseOPML(xml: string): string[] {
  const doc = new DOMParser().parseFromString(xml, 'text/xml')
  const outlines = doc.querySelectorAll('outline[xmlUrl], outline[xmlurl]')
  return Array.from(outlines)
    .map((el) => el.getAttribute('xmlUrl') ?? el.getAttribute('xmlurl') ?? '')
    .filter(Boolean)
}
