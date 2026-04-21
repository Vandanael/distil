import { parseHTML } from 'linkedom'

const MAX_RATIO = 0.5

export type ExtractResult = {
  html: string
  extractWordCount: number
  originalWordCount: number
  truncated: boolean
}

function wordCount(text: string | null | undefined): number {
  if (!text) return 0
  return text.trim().split(/\s+/).filter(Boolean).length
}

// Tronque un HTML d'article a un extrait coupe en fin de noeud top-level (paragraphe
// ou bloc), selon un ratio cible (ex 0.3) avec un plancher minWords et un plafond
// dur MAX_RATIO (0.5). Garantit la coherence originalWordCount / extractWordCount
// en recalculant les deux depuis le HTML passe.
export function truncateToExtract(
  htmlString: string,
  ratio: number,
  minWords: number,
): ExtractResult {
  const safeRatio = Number.isFinite(ratio) && ratio > 0 ? Math.min(ratio, MAX_RATIO) : 0.3
  const safeMin = Number.isFinite(minWords) && minWords >= 0 ? minWords : 150

  const source = htmlString ?? ''
  if (!source.trim()) {
    return { html: '', extractWordCount: 0, originalWordCount: 0, truncated: false }
  }

  // linkedom wrappe un fragment dans <html><head></head><body>…</body></html>.
  // On travaille sur body.children : les noeuds top-level de l'article.
  const { document } = parseHTML(`<!doctype html><html><body>${source}</body></html>`)
  const body = document.body
  if (!body) {
    const total = wordCount(source.replace(/<[^>]+>/g, ' '))
    return { html: source, extractWordCount: total, originalWordCount: total, truncated: false }
  }

  const topLevel = Array.from(body.children) as Element[]
  const originalWordCount = topLevel.reduce((sum, el) => sum + wordCount(el.textContent), 0)

  // Cas degenere : aucun noeud top-level (texte nu sans balise). On ne tronque pas.
  if (topLevel.length === 0 || originalWordCount === 0) {
    return {
      html: source,
      extractWordCount: originalWordCount,
      originalWordCount,
      truncated: false,
    }
  }

  const ratioTarget = Math.floor(safeRatio * originalWordCount)
  const hardCeiling = Math.floor(MAX_RATIO * originalWordCount)
  const target = Math.min(Math.max(ratioTarget, safeMin), hardCeiling)

  // Si le plafond 50% est inferieur au plancher minWords (article tres court),
  // le plafond l'emporte : on retourne l'article entier s'il ne depasse pas
  // deja le plafond, sinon on coupe au plafond.
  if (originalWordCount <= target) {
    return {
      html: source,
      extractWordCount: originalWordCount,
      originalWordCount,
      truncated: false,
    }
  }

  const kept: Element[] = []
  let cumulative = 0
  for (const el of topLevel) {
    const wc = wordCount(el.textContent)
    kept.push(el)
    cumulative += wc
    if (cumulative >= target) break
  }

  const html = kept.map((el) => el.outerHTML).join('')
  const truncated = kept.length < topLevel.length
  return {
    html,
    extractWordCount: cumulative,
    originalWordCount,
    truncated,
  }
}
