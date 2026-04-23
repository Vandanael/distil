// Ponderation RSS/agent du ranker.
// Source unique de verite pour les constantes qui gouvernent le split des
// slots essentiels entre flux RSS et decouverte agent.
// Contexte : docs/sprints/plan-unified-pipelines.md §3.

// Plancher : meme quand la decouverte agent est tres abondante, on garde au
// moins 25% du bucket essentiel pour les sources RSS du user.
export const RSS_RATIO_FLOOR = 0.25

// Plafond mode 'active' : meme quand le pool RSS pertinent est massif, on laisse
// au moins 25% du bucket essentiel a l'agent pour nourrir la diversite.
export const RSS_RATIO_CEILING = 0.75

// Objectif de pool RSS "confortable" = dailyCap * 2. Si le pool pertinent
// atteint ce seuil, le ratio sature au plafond (0.75 en mode actif).
export const RSS_POOL_TARGET_MULTIPLIER = 2

// Distance cosine maximale pour qu'un item RSS soit compte comme "pertinent"
// dans count_relevant_rss. En dessous, l'item est suffisamment aligne pour
// peser dans le denominateur du ratio.
export const RSS_RELEVANCE_DISTANCE_MAX = 0.5

// Seuil minimum de mots pour qu'un item entre dans le pool cosine du prefilter.
// Anciennement 300, puis 100. Abaisse a 10 : ne plus exclure les teasers RSS
// legitimes (titre + chapo) des editeurs classiques. Seuls les items quasi-vides
// (< 10 mots) sont exclus.
// Parametrable via le RPC prefilter_ranking_candidates(min_word_count => N).
export const MIN_WORD_COUNT = 10

// Mode 'sources_first' : seuil Pipeline A (refresh) au-dessus duquel on skip
// la decouverte agent du tout. N'intervient pas dans le calcul du ratio cote
// ranker (qui utilise rssAvailable >= dailyCap directement).
export const SOURCES_FIRST_RSS_SUFFICIENCY = 1.5

// Plafond mode 'sources_first' : meme quand le pool est juste, on garde
// jusqu'a 5% pour l'agent.
export const RSS_RATIO_CEILING_SOURCES_FIRST = 0.95

export type DiscoveryMode = 'active' | 'sources_first'

/**
 * Ratio de slots essentiels alloues aux items RSS (vs agent).
 * Formule : rssAvailable / (dailyCap * 2), clampe entre [floor, ceiling].
 */
export function computeRssRatio(opts: { rssAvailable: number; dailyCap: number }): number {
  const { rssAvailable, dailyCap } = opts
  const target = dailyCap * RSS_POOL_TARGET_MULTIPLIER
  const raw = rssAvailable / Math.max(target, 1)
  return Math.min(RSS_RATIO_CEILING, Math.max(RSS_RATIO_FLOOR, raw))
}

/**
 * Applique le mode de decouverte au ratio brut :
 * - 'active' : ratio adaptatif (floor 0.25, ceiling 0.75).
 * - 'sources_first' : si rssAvailable >= dailyCap, force 1.0 ;
 *   sinon ratio adaptatif clampe au ceiling sources_first (0.95).
 */
export function resolveRssRatio(opts: {
  rssAvailable: number
  dailyCap: number
  mode: DiscoveryMode
  coldStart?: boolean
}): number {
  if (opts.coldStart) return 1

  if (opts.mode === 'sources_first') {
    if (opts.rssAvailable >= opts.dailyCap) return 1
    const target = opts.dailyCap * RSS_POOL_TARGET_MULTIPLIER
    const raw = opts.rssAvailable / Math.max(target, 1)
    return Math.min(RSS_RATIO_CEILING_SOURCES_FIRST, Math.max(RSS_RATIO_FLOOR, raw))
  }

  return computeRssRatio(opts)
}
