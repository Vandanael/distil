/**
 * Normalisation partagee des keywords (profil interests et haystacks de matching).
 * Source de verite pour : lowercase + retrait des diacritiques + trim.
 * Coherent avec la fonction SQL normalize_keyword (migration 00024).
 */

export function normalizeKeyword(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

/**
 * Parse un champ CSV (ex: "AI, ML, produit") en tableau de keywords normalises,
 * sans doublons, sans entrees vides. Stable order : premiere occurrence gagne.
 */
export function splitInterestsFromCsv(csv: string): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of csv.split(',')) {
    const normalized = normalizeKeyword(raw)
    if (!normalized || seen.has(normalized)) continue
    seen.add(normalized)
    out.push(normalized)
  }
  return out
}
