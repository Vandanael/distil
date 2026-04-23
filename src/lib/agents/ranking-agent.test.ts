import { describe, it, expect, vi } from 'vitest'
import {
  enforceMinRelevance,
  MIN_Q1_RELEVANCE,
  applyCosineGuard,
  injectReservedKeywordSlots,
  composeEdition,
  integrateCarryOvers,
  resolveIndexedItems,
  persistRanking,
  MAX_ESSENTIAL_DISTANCE,
  HIGH_RELEVANCE_Q1,
  RESERVED_KEYWORD_SLOTS,
} from './ranking-agent'
import type { LlmRankedItem, LlmRawItem } from './ranking-agent'
import type { RankedItem, RankingCandidate } from './ranking-types'

vi.mock('@/lib/errors/log-error', () => ({ logError: vi.fn() }))
vi.mock('@/lib/parsing/readability', () => ({
  parseUrl: vi.fn().mockRejectedValue(new Error('skip enrichment in tests')),
}))

function candidate(
  itemId: string,
  distance: number,
  overrides: Partial<RankingCandidate> = {}
): RankingCandidate {
  return {
    itemId,
    url: `https://example.test/${itemId}`,
    title: null,
    author: null,
    siteName: null,
    publishedAt: null,
    contentPreview: '',
    wordCount: 0,
    distance,
    unpopScore: 0,
    isKeywordHit: false,
    matchedKeywords: [],
    keywordRank: 0,
    sourceKind: 'rss',
    ...overrides,
  }
}

function ranked(itemId: string, rank: number): RankedItem {
  return {
    itemId,
    q1: 8,
    q2: 5,
    q3: 5,
    justification: '',
    bucket: 'essential',
    rank,
  }
}

describe('enforceMinRelevance', () => {
  it('exclut les items Q1 < 6', () => {
    const items = [
      { item_id: 'a', q1: 5, q2: 7, q3: 8, justification: 'off' },
      { item_id: 'b', q1: 8, q2: 4, q3: 5, justification: 'core' },
      { item_id: 'c', q1: 6, q2: 6, q3: 7, justification: 'edge' },
    ]
    const kept = enforceMinRelevance(items)
    expect(kept.map((i) => i.item_id)).toEqual(['b', 'c'])
  })

  it('exclut les Q1 undefined/nul', () => {
    const items = [
      { item_id: 'a', q1: 0, q2: 7, q3: 8, justification: 'zero' },
      { item_id: 'b', q1: 9, q2: 7, q3: 8, justification: 'high' },
    ]
    expect(enforceMinRelevance(items).map((i) => i.item_id)).toEqual(['b'])
  })

  it('laisse passer Q1 exactement au seuil', () => {
    const items = [{ item_id: 'a', q1: MIN_Q1_RELEVANCE, q2: 6, q3: 7, justification: 'ok' }]
    expect(enforceMinRelevance(items)).toHaveLength(1)
  })

  it('tableau vide renvoie tableau vide', () => {
    expect(enforceMinRelevance([])).toEqual([])
  })

  it('seuil documente a 6', () => {
    expect(MIN_Q1_RELEVANCE).toBe(6)
  })
})

describe('applyCosineGuard', () => {
  it('downgrade un item essential Q1 >= 7 avec distance > 0.6 vers surprise', () => {
    const essential = [
      { item_id: 'close', q1: 8, q2: 5, q3: 5, justification: '' },
      { item_id: 'far', q1: 8, q2: 5, q3: 5, justification: 'off-topic' },
    ]
    const candidates = [candidate('close', 0.3), candidate('far', 0.8)]
    const out = applyCosineGuard(essential, [], candidates)
    expect(out.essential.map((i) => i.item_id)).toEqual(['close'])
    expect(out.surprise.map((i) => i.item_id)).toEqual(['far'])
  })

  it('drop un item surprise Q1 >= 7 avec distance > 0.6', () => {
    const surprise = [
      { item_id: 'close', q1: 7, q2: 8, q3: 6, justification: '' },
      { item_id: 'far', q1: 7, q2: 8, q3: 6, justification: 'off-topic' },
    ]
    const candidates = [candidate('close', 0.4), candidate('far', 0.9)]
    const out = applyCosineGuard([], surprise, candidates)
    expect(out.essential).toHaveLength(0)
    expect(out.surprise.map((i) => i.item_id)).toEqual(['close'])
  })

  it("laisse passer un Q1 < 7 meme avec distance elevee (pas de pretention d'alignement)", () => {
    const essential = [{ item_id: 'weak', q1: 6, q2: 5, q3: 5, justification: '' }]
    const candidates = [candidate('weak', 0.9)]
    const out = applyCosineGuard(essential, [], candidates)
    expect(out.essential.map((i) => i.item_id)).toEqual(['weak'])
  })

  it('laisse passer un Q1 >= 7 proche (distance <= seuil)', () => {
    const essential = [{ item_id: 'ok', q1: 9, q2: 5, q3: 5, justification: '' }]
    const candidates = [candidate('ok', MAX_ESSENTIAL_DISTANCE)]
    const out = applyCosineGuard(essential, [], candidates)
    expect(out.essential.map((i) => i.item_id)).toEqual(['ok'])
  })

  it('ignore les items dont le candidat est absent (pas de distance = pas de verdict)', () => {
    const essential = [{ item_id: 'missing', q1: 10, q2: 5, q3: 5, justification: '' }]
    const out = applyCosineGuard(essential, [], [])
    expect(out.essential.map((i) => i.item_id)).toEqual(['missing'])
  })

  it('constantes documentees', () => {
    expect(MAX_ESSENTIAL_DISTANCE).toBe(0.6)
    expect(HIGH_RELEVANCE_Q1).toBe(7)
  })
})

describe('injectReservedKeywordSlots', () => {
  it("force les top keyword_hits dans essential quand aucun n'est promu", () => {
    const essential = [
      ranked('e1', 1),
      ranked('e2', 2),
      ranked('e3', 3),
      ranked('e4', 4),
      ranked('e5', 5),
    ]
    const candidates = [
      candidate('e1', 0.1),
      candidate('e2', 0.2),
      candidate('e3', 0.3),
      candidate('e4', 0.4),
      candidate('e5', 0.5),
      candidate('k1', 0.9, { isKeywordHit: true, matchedKeywords: ['llm'], keywordRank: 0.9 }),
      candidate('k2', 0.9, { isKeywordHit: true, matchedKeywords: ['llm'], keywordRank: 0.7 }),
      candidate('k3', 0.9, { isKeywordHit: true, matchedKeywords: ['llm'], keywordRank: 0.5 }),
    ]
    const out = injectReservedKeywordSlots(essential, [], candidates)
    expect(out.forceInjected).toBe(RESERVED_KEYWORD_SLOTS)
    const ids = out.essential.map((r) => r.itemId)
    // Les 2 derniers non-keyword ejectes, les 2 top keyword_hits injectes.
    expect(ids).toContain('k1')
    expect(ids).toContain('k2')
    expect(ids).not.toContain('e4')
    expect(ids).not.toContain('e5')
    expect(out.essential).toHaveLength(5)
    // rank reatribue
    expect(out.essential.map((r) => r.rank)).toEqual([1, 2, 3, 4, 5])
  })

  it('ne fait rien si 2 keyword_hits sont deja dans essential', () => {
    const essential = [
      ranked('k1', 1),
      ranked('k2', 2),
      ranked('e3', 3),
      ranked('e4', 4),
      ranked('e5', 5),
    ]
    const candidates = [
      candidate('k1', 0.1, { isKeywordHit: true, matchedKeywords: ['llm'], keywordRank: 0.9 }),
      candidate('k2', 0.2, { isKeywordHit: true, matchedKeywords: ['llm'], keywordRank: 0.8 }),
      candidate('e3', 0.3),
      candidate('e4', 0.4),
      candidate('e5', 0.5),
      candidate('k3', 0.9, { isKeywordHit: true, matchedKeywords: ['llm'], keywordRank: 0.7 }),
    ]
    const out = injectReservedKeywordSlots(essential, [], candidates)
    expect(out.forceInjected).toBe(0)
    expect(out.essential).toEqual(essential)
  })

  it('ne double-injecte pas un keyword_hit deja present dans surprise', () => {
    const essential = [ranked('e1', 1)]
    const surprise = [ranked('k1', 1)]
    const candidates = [
      candidate('e1', 0.1),
      candidate('k1', 0.5, { isKeywordHit: true, matchedKeywords: ['llm'], keywordRank: 0.9 }),
      candidate('k2', 0.5, { isKeywordHit: true, matchedKeywords: ['llm'], keywordRank: 0.8 }),
    ]
    const out = injectReservedKeywordSlots(essential, surprise, candidates)
    // k1 est deja en surprise donc ne compte pas comme slot a combler (existingKwEssential=0)
    // mais on ne le re-injecte pas : on prend k2 (le prochain non-promu).
    const ids = out.essential.map((r) => r.itemId)
    expect(ids).toContain('k2')
    expect(ids).not.toContain('k1')
  })

  it('respecte slotsNeeded si 1 keyword_hit est deja dans essential', () => {
    // essential deja a 5 : ejection de e5 pour placer k2 (1 slot manquant).
    const essential = [
      ranked('k1', 1),
      ranked('e2', 2),
      ranked('e3', 3),
      ranked('e4', 4),
      ranked('e5', 5),
    ]
    const candidates = [
      candidate('k1', 0.1, { isKeywordHit: true, matchedKeywords: ['llm'], keywordRank: 0.9 }),
      candidate('e2', 0.2),
      candidate('e3', 0.3),
      candidate('e4', 0.4),
      candidate('e5', 0.5),
      candidate('k2', 0.9, { isKeywordHit: true, matchedKeywords: ['llm'], keywordRank: 0.7 }),
    ]
    const out = injectReservedKeywordSlots(essential, [], candidates)
    expect(out.forceInjected).toBe(1)
    expect(out.essential).toHaveLength(5)
    const ids = out.essential.map((r) => r.itemId)
    expect(ids).toContain('k1')
    expect(ids).toContain('k2')
    expect(ids).toContain('e2')
    expect(ids).not.toContain('e5')
  })

  it("aucun keyword_hit disponible = pas d'injection", () => {
    const essential = [ranked('e1', 1), ranked('e2', 2)]
    const candidates = [candidate('e1', 0.1), candidate('e2', 0.2)]
    const out = injectReservedKeywordSlots(essential, [], candidates)
    expect(out.forceInjected).toBe(0)
    expect(out.essential).toEqual(essential)
  })

  it('tri par keywordRank decroissant pour choisir les injections', () => {
    const essential = [
      ranked('e1', 1),
      ranked('e2', 2),
      ranked('e3', 3),
      ranked('e4', 4),
      ranked('e5', 5),
    ]
    const candidates = [
      candidate('e1', 0.1),
      candidate('e2', 0.2),
      candidate('e3', 0.3),
      candidate('e4', 0.4),
      candidate('e5', 0.5),
      candidate('low', 0.9, { isKeywordHit: true, matchedKeywords: ['x'], keywordRank: 0.1 }),
      candidate('mid', 0.9, { isKeywordHit: true, matchedKeywords: ['x'], keywordRank: 0.5 }),
      candidate('top', 0.9, { isKeywordHit: true, matchedKeywords: ['x'], keywordRank: 0.9 }),
    ]
    const out = injectReservedKeywordSlots(essential, [], candidates)
    const ids = out.essential.map((r) => r.itemId)
    expect(ids).toContain('top')
    expect(ids).toContain('mid')
    expect(ids).not.toContain('low')
  })

  it('constante RESERVED_KEYWORD_SLOTS documentee', () => {
    expect(RESERVED_KEYWORD_SLOTS).toBe(2)
  })

  it("grandit essential jusqu'a 5 au lieu d'ejecter quand l'essential LLM est petit", () => {
    // LLM retourne 2 essentials + 2 keyword_hits a injecter -> 4 items au final,
    // pas 2. L'ejection ne se declenche que si essential est deja sature.
    const essential = [ranked('e1', 1), ranked('e2', 2)]
    const candidates = [
      candidate('e1', 0.1),
      candidate('e2', 0.2),
      candidate('k1', 0.9, { isKeywordHit: true, matchedKeywords: ['llm'], keywordRank: 0.9 }),
      candidate('k2', 0.9, { isKeywordHit: true, matchedKeywords: ['llm'], keywordRank: 0.7 }),
    ]
    const out = injectReservedKeywordSlots(essential, [], candidates)
    expect(out.forceInjected).toBe(2)
    expect(out.essential).toHaveLength(4)
    const ids = out.essential.map((r) => r.itemId)
    expect(ids).toContain('e1')
    expect(ids).toContain('e2')
    expect(ids).toContain('k1')
    expect(ids).toContain('k2')
  })
})

function llmItem(
  id: string,
  q1: number,
  bucket: 'essential' | 'surprise' = 'essential'
): LlmRankedItem {
  return { item_id: id, q1, q2: 5, q3: 5, justification: '' }
}

function makeItems(ids: string[], q1: number): LlmRankedItem[] {
  return ids.map((id) => llmItem(id, q1))
}

describe('composeEdition', () => {
  it('cas 12 qualifying → retourne 8 (6 essential + 2 surprise, aucun flag)', () => {
    const essential = makeItems(['e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'e7', 'e8', 'e9', 'e10'], 8)
    const surprise = makeItems(['s1', 's2'], 7)
    const out = composeEdition(essential, surprise, [])
    expect(out.essential.length + out.surprise.length).toBe(8)
    expect(out.essential).toHaveLength(6)
    expect(out.surprise).toHaveLength(2)
    expect(out.essential.every((r) => !r.belowNormalThreshold)).toBe(true)
    expect(out.surprise.every((r) => !r.belowNormalThreshold)).toBe(true)
  })

  it('cas 6 qualifying → retourne 6 (4 essential + 2 surprise)', () => {
    const essential = makeItems(['e1', 'e2', 'e3', 'e4'], 7)
    const surprise = makeItems(['s1', 's2'], 6)
    const out = composeEdition(essential, surprise, [])
    expect(out.essential.length + out.surprise.length).toBe(6)
    expect(out.essential).toHaveLength(4)
    expect(out.surprise).toHaveLength(2)
    expect(out.essential.every((r) => !r.belowNormalThreshold)).toBe(true)
  })

  it('cas 3 qualifying → retourne 5 (4 essential + 1 surprise), repêchés flaggés', () => {
    const essential = makeItems(['e1', 'e2', 'e3'], 7)
    const surpriseLow = makeItems(['s1', 's2'], 4) // below threshold, available for repêche
    const out = composeEdition(essential, surpriseLow, [])
    const total = out.essential.length + out.surprise.length
    expect(total).toBe(5)
    expect(out.essential).toHaveLength(4)
    expect(out.surprise).toHaveLength(1)
    const repecheItems = [...out.essential, ...out.surprise].filter((r) => r.belowNormalThreshold)
    expect(repecheItems.length).toBeGreaterThan(0)
  })

  it('tous les repechés ont belowNormalThreshold=true, les qualifiants false', () => {
    const essential = makeItems(['e1'], 8) // 1 qualifying
    const surplus = makeItems(['b1', 'b2', 'b3', 'b4'], 4) // below threshold for repêche
    const out = composeEdition(essential, surplus, [])
    const qualifyingItems = [...out.essential, ...out.surprise].filter(
      (r) => !r.belowNormalThreshold
    )
    const repecheItems = [...out.essential, ...out.surprise].filter((r) => r.belowNormalThreshold)
    expect(qualifyingItems.some((r) => r.itemId === 'e1')).toBe(true)
    expect(repecheItems.every((r) => r.belowNormalThreshold)).toBe(true)
  })

  it('retourne au moins minCount items meme avec peu de qualifying', () => {
    const essential = makeItems(['e1'], 8)
    const out = composeEdition(essential, [], [])
    expect(out.essential.length + out.surprise.length).toBeGreaterThanOrEqual(1)
  })

  it('retourne au plus maxCount items', () => {
    const essential = makeItems(['e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'e7', 'e8', 'e9', 'e10'], 9)
    const surprise = makeItems(['s1', 's2', 's3', 's4', 's5'], 7)
    const out = composeEdition(essential, surprise, [])
    expect(out.essential.length + out.surprise.length).toBeLessThanOrEqual(8)
  })

  it('bucket buckets correctement affectes', () => {
    const essential = makeItems(['e1', 'e2', 'e3', 'e4', 'e5'], 8)
    const surprise = makeItems(['s1', 's2'], 7)
    const out = composeEdition(essential, surprise, [])
    expect(out.essential.every((r) => r.bucket === 'essential')).toBe(true)
    expect(out.surprise.every((r) => r.bucket === 'surprise')).toBe(true)
  })
})

describe('composeEdition - split RSS/agent par rssRatio', () => {
  function rssCand(id: string): RankingCandidate {
    return candidate(id, 0.3, { sourceKind: 'rss' })
  }
  function agentCand(id: string): RankingCandidate {
    return candidate(id, 0.3, { sourceKind: 'agent' })
  }

  it('rssRatio 1.0 : aucun slot essentiel ne va a l agent (cold start / sources_first sature)', () => {
    // 8 essentials LLM : 4 RSS + 4 agent. rssRatio = 1 => les 6 essentiels sont RSS only.
    const essential = [
      ...makeItems(['r1', 'r2', 'r3', 'r4'], 8),
      ...makeItems(['a1', 'a2', 'a3', 'a4'], 8),
    ]
    const surprise = makeItems(['s1', 's2'], 7)
    const candidates = [
      rssCand('r1'),
      rssCand('r2'),
      rssCand('r3'),
      rssCand('r4'),
      agentCand('a1'),
      agentCand('a2'),
      agentCand('a3'),
      agentCand('a4'),
      agentCand('s1'),
      agentCand('s2'),
    ]
    const out = composeEdition(essential, surprise, candidates, { rssRatio: 1 })
    // 10 qualifying -> target = 8 ; targetEssential = ceil(8 * 0.75) = 6
    expect(out.essential).toHaveLength(6)
    const rssKinds = out.essential.filter((r) => r.sourceKind === 'rss')
    const agentKinds = out.essential.filter((r) => r.sourceKind === 'agent')
    // 4 RSS disponibles, 2 slots restants debordent sur agent (overflow)
    expect(rssKinds).toHaveLength(4)
    expect(agentKinds).toHaveLength(2)
  })

  it('rssRatio 0.75 : 75% essentiels RSS, 25% agent', () => {
    const essential = [
      ...makeItems(['r1', 'r2', 'r3', 'r4', 'r5'], 8),
      ...makeItems(['a1', 'a2', 'a3'], 8),
    ]
    const surprise = makeItems(['s1', 's2', 's3'], 7)
    const candidates = [
      rssCand('r1'),
      rssCand('r2'),
      rssCand('r3'),
      rssCand('r4'),
      rssCand('r5'),
      agentCand('a1'),
      agentCand('a2'),
      agentCand('a3'),
      agentCand('s1'),
      agentCand('s2'),
      agentCand('s3'),
    ]
    const out = composeEdition(essential, surprise, candidates, { rssRatio: 0.75 })
    // targetEssential = 6 ; round(6 * 0.75) = 5 RSS + 1 agent
    expect(out.essential).toHaveLength(6)
    expect(out.essential.filter((r) => r.sourceKind === 'rss')).toHaveLength(5)
    expect(out.essential.filter((r) => r.sourceKind === 'agent')).toHaveLength(1)
  })

  it('rssRatio 0.5 : split 50/50 essentiels', () => {
    const essential = [
      ...makeItems(['r1', 'r2', 'r3', 'r4'], 8),
      ...makeItems(['a1', 'a2', 'a3', 'a4'], 8),
    ]
    const surprise = makeItems(['s1', 's2'], 7)
    const candidates = [
      rssCand('r1'),
      rssCand('r2'),
      rssCand('r3'),
      rssCand('r4'),
      agentCand('a1'),
      agentCand('a2'),
      agentCand('a3'),
      agentCand('a4'),
      agentCand('s1'),
      agentCand('s2'),
    ]
    const out = composeEdition(essential, surprise, candidates, { rssRatio: 0.5 })
    expect(out.essential).toHaveLength(6)
    expect(out.essential.filter((r) => r.sourceKind === 'rss')).toHaveLength(3)
    expect(out.essential.filter((r) => r.sourceKind === 'agent')).toHaveLength(3)
  })

  it('rssRatio 0.25 : 25% RSS, 75% agent essentiels', () => {
    const essential = [
      ...makeItems(['r1', 'r2', 'r3'], 8),
      ...makeItems(['a1', 'a2', 'a3', 'a4', 'a5'], 8),
    ]
    const surprise = makeItems(['s1', 's2', 's3'], 7)
    const candidates = [
      rssCand('r1'),
      rssCand('r2'),
      rssCand('r3'),
      agentCand('a1'),
      agentCand('a2'),
      agentCand('a3'),
      agentCand('a4'),
      agentCand('a5'),
      agentCand('s1'),
      agentCand('s2'),
      agentCand('s3'),
    ]
    const out = composeEdition(essential, surprise, candidates, { rssRatio: 0.25 })
    // round(6 * 0.25) = 2 RSS + 4 agent
    expect(out.essential).toHaveLength(6)
    expect(out.essential.filter((r) => r.sourceKind === 'rss')).toHaveLength(2)
    expect(out.essential.filter((r) => r.sourceKind === 'agent')).toHaveLength(4)
  })

  it('overflow agent vers RSS quand pool agent insuffisant', () => {
    // rssRatio 0.25 => 2 RSS + 4 agent theoriques, mais 1 seul agent disponible
    const essential = [
      ...makeItems(['r1', 'r2', 'r3', 'r4', 'r5'], 8),
      ...makeItems(['a1'], 8),
    ]
    const surprise = makeItems(['s1', 's2', 's3'], 7)
    const candidates = [
      rssCand('r1'),
      rssCand('r2'),
      rssCand('r3'),
      rssCand('r4'),
      rssCand('r5'),
      agentCand('a1'),
      rssCand('s1'),
      rssCand('s2'),
      rssCand('s3'),
    ]
    const out = composeEdition(essential, surprise, candidates, { rssRatio: 0.25 })
    expect(out.essential).toHaveLength(6)
    expect(out.essential.filter((r) => r.sourceKind === 'agent')).toHaveLength(1)
    expect(out.essential.filter((r) => r.sourceKind === 'rss')).toHaveLength(5)
  })

  it('overflow RSS vers agent quand pool RSS insuffisant', () => {
    // rssRatio 0.75 => 5 RSS + 1 agent theoriques, mais 1 seul RSS disponible
    const essential = [
      ...makeItems(['r1'], 8),
      ...makeItems(['a1', 'a2', 'a3', 'a4', 'a5'], 8),
    ]
    const surprise = makeItems(['s1', 's2', 's3'], 7)
    const candidates = [
      rssCand('r1'),
      agentCand('a1'),
      agentCand('a2'),
      agentCand('a3'),
      agentCand('a4'),
      agentCand('a5'),
      agentCand('s1'),
      agentCand('s2'),
      agentCand('s3'),
    ]
    const out = composeEdition(essential, surprise, candidates, { rssRatio: 0.75 })
    expect(out.essential).toHaveLength(6)
    expect(out.essential.filter((r) => r.sourceKind === 'rss')).toHaveLength(1)
    expect(out.essential.filter((r) => r.sourceKind === 'agent')).toHaveLength(5)
  })

  it('sourceKind propage sur surprise (pas de contrainte de ratio)', () => {
    const essential = makeItems(['r1', 'r2', 'r3', 'r4'], 8)
    const surprise = [...makeItems(['s1'], 7), ...makeItems(['a1'], 7)]
    const candidates = [
      rssCand('r1'),
      rssCand('r2'),
      rssCand('r3'),
      rssCand('r4'),
      rssCand('s1'),
      agentCand('a1'),
    ]
    const out = composeEdition(essential, surprise, candidates, { rssRatio: 0.5 })
    expect(out.surprise.some((r) => r.sourceKind === 'rss')).toBe(true)
    expect(out.surprise.some((r) => r.sourceKind === 'agent')).toBe(true)
  })
})

describe('resolveIndexedItems', () => {
  it('mappe les indices vers les UUIDs via indexMap', () => {
    const indexMap = new Map<number, string>([[1, 'uuid-a'], [2, 'uuid-b']])
    const raw: LlmRawItem[] = [
      { item_id: 1, q1: 8, q2: 5, q3: 7, justification: 'bon article' },
      { item_id: 2, q1: 7, q2: 6, q3: 6, justification: 'interessant' },
    ]
    const { items, invalidIndices } = resolveIndexedItems(raw, indexMap)
    expect(items).toHaveLength(2)
    expect(items[0].item_id).toBe('uuid-a')
    expect(items[1].item_id).toBe('uuid-b')
    expect(invalidIndices).toHaveLength(0)
  })

  it('collecte les indices inconnus et les ignore sans lever', () => {
    const indexMap = new Map<number, string>([[1, 'uuid-a']])
    const raw: LlmRawItem[] = [
      { item_id: 1, q1: 8, q2: 5, q3: 7, justification: 'ok' },
      { item_id: 99, q1: 7, q2: 6, q3: 6, justification: 'fantome' },
      { item_id: 'not-a-number', q1: 6, q2: 5, q3: 5, justification: 'uuid-mutile' },
    ]
    const { items, invalidIndices } = resolveIndexedItems(raw, indexMap)
    expect(items).toHaveLength(1)
    expect(items[0].item_id).toBe('uuid-a')
    expect(invalidIndices).toEqual([99, 'not-a-number'])
  })
})

describe('integrateCarryOvers', () => {
  function rankedQ1(
    itemId: string,
    q1: number,
    bucket: 'essential' | 'surprise' = 'essential'
  ): RankedItem {
    return { itemId, q1, q2: 5, q3: 5, justification: '', bucket, rank: 1 }
  }

  it('retire les N items les moins scores pour laisser la place aux carry-overs', () => {
    const essential = [rankedQ1('e1', 8), rankedQ1('e2', 7), rankedQ1('e3', 6), rankedQ1('e4', 9)]
    const surprise = [rankedQ1('s1', 6, 'surprise'), rankedQ1('s2', 7, 'surprise')]
    const out = integrateCarryOvers(essential, surprise, 2)
    const total = out.essential.length + out.surprise.length
    expect(total).toBe(essential.length + surprise.length - 2)
    // Les 2 plus faibles (q1=6) doivent etre retires
    const allIds = [...out.essential, ...out.surprise].map((r) => r.itemId)
    expect(allIds).not.toContain('e3')
    expect(allIds).not.toContain('s1')
  })

  it('0 carry-overs = aucun changement', () => {
    const essential = [rankedQ1('e1', 8), rankedQ1('e2', 7)]
    const surprise = [rankedQ1('s1', 6, 'surprise')]
    const out = integrateCarryOvers(essential, surprise, 0)
    expect(out.essential).toEqual(essential)
    expect(out.surprise).toEqual(surprise)
  })

  it('re-ranke les items restants depuis 1', () => {
    const essential = [rankedQ1('e1', 9), rankedQ1('e2', 7), rankedQ1('e3', 6)]
    const out = integrateCarryOvers(essential, [], 1)
    expect(out.essential.map((r) => r.rank)).toEqual([1, 2])
  })

  it('avec 10 candidats du jour + 2 carry-overs : edition reduite de 2', () => {
    const essential = Array.from({ length: 6 }, (_, i) => rankedQ1(`e${i}`, 8 - i))
    const surprise = Array.from({ length: 2 }, (_, i) => rankedQ1(`s${i}`, 7, 'surprise'))
    const out = integrateCarryOvers(essential, surprise, 2)
    expect(out.essential.length + out.surprise.length).toBe(6)
  })
})

describe('persistRanking - articles upsert', () => {
  it('appelle upsert avec onConflict user_id,url (pas insert)', async () => {
    const articlesUpsert = vi.fn().mockResolvedValue({ error: null })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = {
      from(table: string) {
        if (table === 'daily_ranking') {
          return { upsert: vi.fn().mockResolvedValue({ error: null }) }
        }
        if (table === 'articles') {
          return { upsert: articlesUpsert }
        }
        if (table === 'profiles') {
          return { update: () => ({ eq: vi.fn().mockResolvedValue({ error: null }) }) }
        }
        throw new Error(`unexpected table: ${table}`)
      },
    }

    const item: RankedItem = {
      itemId: 'item-1',
      q1: 8,
      q2: 5,
      q3: 5,
      justification: 'test',
      bucket: 'essential',
      rank: 1,
    }
    const cand: RankingCandidate = {
      itemId: 'item-1',
      url: 'https://example.test/article-1',
      title: 'Article 1',
      author: null,
      siteName: null,
      publishedAt: null,
      contentPreview: 'preview',
      wordCount: 300,
      distance: 0.3,
      unpopScore: 0,
      isKeywordHit: false,
      matchedKeywords: [],
      keywordRank: 0,
      sourceKind: 'rss',
    }

    await persistRanking(supabase, 'user-uuid', '2026-04-23', [item], [], [cand])

    expect(articlesUpsert).toHaveBeenCalledOnce()
    expect(articlesUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'https://example.test/article-1', user_id: 'user-uuid' }),
      { onConflict: 'user_id,url' }
    )
  })
})
