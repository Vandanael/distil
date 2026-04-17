export type RelevanceTag = 'match_strong' | 'match' | 'discovery'

const MATCH_STRONG_THRESHOLD = 80
const MATCH_THRESHOLD = 60

/**
 * Derive le tag qualitatif affiche a l'utilisateur a partir du score brut.
 * - Serendipity : tag 'discovery' quel que soit le score (la decouverte prime).
 * - Score >= 80 : 'match_strong'.
 * - Score >= 60 : 'match'.
 * - Sinon : null (article filtre trop bas, pas de tag).
 */
export function scoreToTag(
  score: number | null | undefined,
  isSerendipity: boolean
): RelevanceTag | null {
  if (isSerendipity) return 'discovery'
  if (score === null || score === undefined) return null
  if (score >= MATCH_STRONG_THRESHOLD) return 'match_strong'
  if (score >= MATCH_THRESHOLD) return 'match'
  return null
}
