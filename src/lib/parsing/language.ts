// Détection de langue d'un article en cascade 3 niveaux :
//   1. <html lang="..."> si présent et parsable en 'fr'/'en'
//   2. Heuristique mots-outils FR sur les 1000 premiers chars du contenu texte
//   3. Dernier recours : profile.language si 'fr'/'en', sinon 'en'
// Pas de dépendance externe : sujet trop simple pour justifier une lib dédiée.

export type SupportedLanguage = 'fr' | 'en'

// Mots-outils FR très courants, absents ou rares en EN.
// Seuil empirique (cf tests) : >= 3 occurrences dans les 1000 premiers chars => FR.
const FR_STOPWORDS = [
  'le',
  'la',
  'les',
  'des',
  'une',
  'est',
  'pour',
  'dans',
  'avec',
  'sur',
  'par',
  'qui',
  'que',
  'plus',
  'cette',
  'mais',
  'nous',
  'vous',
  'ils',
  'elles',
  'son',
  'ses',
  'leur',
  'être',
  'avoir',
  'aussi',
  'alors',
  'donc',
]

const FR_THRESHOLD = 3
const SAMPLE_CHARS = 1000

/**
 * Normalise une valeur brute de `<html lang>` en 'fr'/'en' si possible.
 * Accepte 'fr', 'fr-FR', 'fr_CA', 'FR', etc. Retourne null sinon.
 */
export function normalizeLangCode(raw: string | null | undefined): SupportedLanguage | null {
  if (!raw) return null
  const prefix = raw.trim().toLowerCase().split(/[-_]/)[0]
  if (prefix === 'fr') return 'fr'
  if (prefix === 'en') return 'en'
  return null
}

/**
 * Niveau 1 de la cascade. Lit l'attribut lang du <html>. Null si absent ou non
 * supporté (ex: 'de', 'es').
 */
export function extractLanguageFromHtml(htmlLang: string | null): SupportedLanguage | null {
  return normalizeLangCode(htmlLang)
}

/**
 * Niveau 2 de la cascade. Compte les mots-outils FR dans un échantillon du
 * contenu texte. Au-dessus du seuil => FR, sinon EN.
 */
export function detectLanguageHeuristic(text: string): SupportedLanguage {
  if (!text) return 'en'
  const sample = text.slice(0, SAMPLE_CHARS).toLowerCase()
  // Tokenisation grossière sur les espaces/ponctuations. Suffit pour distinguer
  // FR d'EN, on ne cherche pas à être parfait.
  const tokens = sample.split(/[^a-zA-ZÀ-ÿ]+/).filter(Boolean)
  let frHits = 0
  const frSet = new Set(FR_STOPWORDS)
  for (const token of tokens) {
    if (frSet.has(token)) {
      frHits++
      if (frHits >= FR_THRESHOLD) return 'fr'
    }
  }
  return 'en'
}

/**
 * Cascade complète. Retourne la langue la plus fiable disponible.
 * - htmlLang prioritaire (source explicite de l'auteur)
 * - sinon heuristique sur contentText
 * - sinon fallback profil user ('en' par défaut si profil en 'both' ou vide)
 */
export function resolveLanguage(opts: {
  htmlLang: string | null
  contentText: string
  profileLanguage?: 'fr' | 'en' | 'both' | null
}): SupportedLanguage {
  const fromHtml = extractLanguageFromHtml(opts.htmlLang)
  if (fromHtml) return fromHtml

  if (opts.contentText && opts.contentText.length > 50) {
    return detectLanguageHeuristic(opts.contentText)
  }

  if (opts.profileLanguage === 'fr' || opts.profileLanguage === 'en') {
    return opts.profileLanguage
  }
  return 'en'
}
