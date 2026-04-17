/**
 * Sources de reference utilisees par le scoring (+8 pts).
 * Extraites du prompt pour etre reutilisables cote client (badge feed).
 */

const REFERENCE_DOMAINS = new Set([
  'arxiv.org',
  'nature.com',
  'pubmed.ncbi.nlm.nih.gov',
  'hal.science',
  'lemonde.fr',
  'nytimes.com',
  'ft.com',
  'economist.com',
  'liberation.fr',
  'stratechery.com',
  'paulgraham.com',
  'simonwillison.net',
])

export function isReferenceDomain(siteName: string | null): boolean {
  if (!siteName) return false
  const normalized = siteName
    .toLowerCase()
    .replace(/^www\./, '')
    .trim()
  return REFERENCE_DOMAINS.has(normalized)
}
