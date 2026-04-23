export type RelevanceTag = 'relevant' | 'discovery' | null

/**
 * Derive le tag qualitatif affiche a l'utilisateur.
 * - bookmarklet : jamais de tag (3e etat null).
 * - bucket='surprise' -> 'discovery' (source de verite).
 * - bucket='essential' -> 'relevant'.
 * - bucket=null : fallback sur isSerendipity, puis score.
 */
export function scoreToTag(
  score: number | null | undefined,
  bucket: 'essential' | 'surprise' | null | undefined,
  isSerendipity: boolean,
  origin: string,
): RelevanceTag {
  if (origin === 'bookmarklet') return null
  if (bucket === 'surprise') return 'discovery'
  if (bucket === 'essential') return 'relevant'
  if (isSerendipity) return 'discovery'
  if (score !== null && score !== undefined && score >= 60) return 'relevant'
  return null
}