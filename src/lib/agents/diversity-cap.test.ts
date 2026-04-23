import { describe, it, expect } from 'vitest'
import { applyDiversityCap, DEFAULT_DIVERSITY_CAP } from './ranking-agent'
import type { RankedItem, RankingCandidate } from './ranking-types'

function makeCandidate(overrides: Partial<RankingCandidate> = {}): RankingCandidate {
  return {
    itemId: overrides.itemId ?? 'item-1',
    url: overrides.url ?? 'https://example.com/article',
    title: overrides.title ?? 'Test article',
    author: overrides.author ?? null,
    siteName: overrides.siteName ?? null,
    publishedAt: overrides.publishedAt ?? null,
    contentPreview: overrides.contentPreview ?? 'Preview text',
    wordCount: overrides.wordCount ?? 500,
    distance: overrides.distance ?? 0.3,
    unpopScore: overrides.unpopScore ?? 0.5,
    isKeywordHit: overrides.isKeywordHit ?? false,
    matchedKeywords: overrides.matchedKeywords ?? [],
    keywordRank: overrides.keywordRank ?? 0,
    sourceKind: overrides.sourceKind ?? 'rss',
  }
}

function makeRankedItem(overrides: Partial<RankedItem> = {}): RankedItem {
  return {
    itemId: overrides.itemId ?? 'item-1',
    q1: overrides.q1 ?? 8,
    q2: overrides.q2 ?? 6,
    q3: overrides.q3 ?? 7,
    justification: overrides.justification ?? 'Test justification',
    bucket: overrides.bucket ?? 'essential',
    rank: overrides.rank ?? 1,
    belowNormalThreshold: overrides.belowNormalThreshold ?? false,
    sourceKind: overrides.sourceKind ?? 'rss',
  }
}

describe('applyDiversityCap', () => {
  it('pas de rejection quand chaque source a au plus 2 articles', () => {
    const essential = [
      makeRankedItem({ itemId: 'a1', rank: 1 }),
      makeRankedItem({ itemId: 'a2', rank: 2 }),
      makeRankedItem({ itemId: 'b1', rank: 3 }),
    ]
    const surprise = [makeRankedItem({ itemId: 'c1', rank: 1, bucket: 'surprise' })]
    const candidates = [
      makeCandidate({ itemId: 'a1', siteName: 'source-a.com' }),
      makeCandidate({ itemId: 'a2', siteName: 'source-a.com' }),
      makeCandidate({ itemId: 'b1', siteName: 'source-b.com' }),
      makeCandidate({ itemId: 'c1', siteName: 'source-c.com' }),
    ]

    const result = applyDiversityCap(essential, surprise, candidates)

    expect(result.rejected).toHaveLength(0)
    expect(result.sourcesCapped).toHaveLength(0)
    expect(result.editionSizeBeforeCap).toBe(4)
    expect(result.editionSizeAfterCap).toBe(4)
  })

  it("rejette le 3e article d'une meme source (cap=2)", () => {
    const essential = [
      makeRankedItem({ itemId: 'a1', rank: 1, q1: 9 }),
      makeRankedItem({ itemId: 'a2', rank: 2, q1: 8 }),
      makeRankedItem({ itemId: 'a3', rank: 3, q1: 7 }),
    ]
    const surprise = [makeRankedItem({ itemId: 'b1', rank: 1, q1: 6, bucket: 'surprise' })]
    const candidates = [
      makeCandidate({ itemId: 'a1', siteName: 'source-a.com' }),
      makeCandidate({ itemId: 'a2', siteName: 'source-a.com' }),
      makeCandidate({ itemId: 'a3', siteName: 'source-a.com' }),
      makeCandidate({ itemId: 'b1', siteName: 'source-b.com' }),
    ]

    const result = applyDiversityCap(essential, surprise, candidates)

    expect(result.rejected).toHaveLength(1)
    expect(result.rejected[0].article_id).toBe('a3')
    expect(result.rejected[0].source).toBe('source-a.com')
    expect(result.rejected[0].score).toBe(70)
    expect(result.rejected[0].reason).toBe('source_cap_exceeded')
    expect(result.sourcesCapped).toEqual(['source-a.com'])
    expect(result.kept).toHaveLength(3)
  })

  it('utilise extractDomain comme fallback si siteName est null', () => {
    const essential = [
      makeRankedItem({ itemId: 'a1', rank: 1 }),
      makeRankedItem({ itemId: 'a2', rank: 2 }),
      makeRankedItem({ itemId: 'a3', rank: 3 }),
    ]
    const candidates = [
      makeCandidate({ itemId: 'a1', siteName: null, url: 'https://www.example.com/article1' }),
      makeCandidate({ itemId: 'a2', siteName: null, url: 'https://www.example.com/article2' }),
      makeCandidate({ itemId: 'a3', siteName: null, url: 'https://www.example.com/article3' }),
    ]

    const result = applyDiversityCap(essential, [], candidates)

    expect(result.rejected).toHaveLength(1)
    expect(result.rejected[0].source).toBe('example.com')
  })

  it("edition de 8 items avec 4 d'une meme source : cap a 2 = edition reduite a 5", () => {
    const essential = [
      makeRankedItem({ itemId: 'i1', rank: 1, q1: 9 }),
      makeRankedItem({ itemId: 'i2', rank: 2, q1: 8 }),
      makeRankedItem({ itemId: 'i3', rank: 3, q1: 7 }),
      makeRankedItem({ itemId: 'i4', rank: 4, q1: 6 }),
    ]
    const surprise = [
      makeRankedItem({ itemId: 's1', rank: 1, q1: 5, bucket: 'surprise' }),
      makeRankedItem({ itemId: 'i5', rank: 2, q1: 4, bucket: 'surprise' }),
      makeRankedItem({ itemId: 's2', rank: 3, q1: 3, bucket: 'surprise' }),
      makeRankedItem({ itemId: 's3', rank: 4, q1: 2, bucket: 'surprise' }),
    ]
    const candidates = [
      makeCandidate({ itemId: 'i1', siteName: 'import-ai.net' }),
      makeCandidate({ itemId: 'i2', siteName: 'import-ai.net' }),
      makeCandidate({ itemId: 'i3', siteName: 'import-ai.net' }),
      makeCandidate({ itemId: 'i4', siteName: 'import-ai.net' }),
      makeCandidate({ itemId: 's1', siteName: 'other-source.com' }),
      makeCandidate({ itemId: 'i5', siteName: 'import-ai.net' }),
      makeCandidate({ itemId: 's2', siteName: 'third.com' }),
      makeCandidate({ itemId: 's3', siteName: 'fourth.com' }),
    ]

    const result = applyDiversityCap(essential, surprise, candidates, 2)

    expect(result.editionSizeBeforeCap).toBe(8)
    expect(result.rejected).toHaveLength(3) // i3, i4, i5 from import-ai.net (kept i1, i2)
    expect(result.sourcesCapped).toEqual(['import-ai.net'])
    expect(result.editionSizeAfterCap).toBe(5) // i1, i2 + s1, s2, s3
  })

  it('tie-break deterministe : les premiers en rang sont gardes', () => {
    const essential = [
      makeRankedItem({ itemId: 'a1', rank: 1, q1: 9 }),
      makeRankedItem({ itemId: 'a2', rank: 2, q1: 8 }),
      makeRankedItem({ itemId: 'a3', rank: 3, q1: 9 }),
    ]
    const candidates = [
      makeCandidate({ itemId: 'a1', siteName: 'source.com' }),
      makeCandidate({ itemId: 'a2', siteName: 'source.com' }),
      makeCandidate({ itemId: 'a3', siteName: 'source.com' }),
    ]

    const result = applyDiversityCap(essential, [], candidates)

    // a1 et a2 sont gardes (ranks 1 et 2), a3 rejete (rank 3)
    expect(result.kept.map((i) => i.itemId)).toEqual(['a1', 'a2'])
    expect(result.rejected[0].article_id).toBe('a3')
  })

  it('cap personnalise a 3', () => {
    const essential = [
      makeRankedItem({ itemId: 'a1', rank: 1 }),
      makeRankedItem({ itemId: 'a2', rank: 2 }),
      makeRankedItem({ itemId: 'a3', rank: 3 }),
      makeRankedItem({ itemId: 'a4', rank: 4 }),
    ]
    const candidates = [
      makeCandidate({ itemId: 'a1', siteName: 'source.com' }),
      makeCandidate({ itemId: 'a2', siteName: 'source.com' }),
      makeCandidate({ itemId: 'a3', siteName: 'source.com' }),
      makeCandidate({ itemId: 'a4', siteName: 'source.com' }),
    ]

    const result = applyDiversityCap(essential, [], candidates, 3)

    expect(result.kept).toHaveLength(3)
    expect(result.rejected).toHaveLength(1)
  })

  it('DEFAULT_DIVERSITY_CAP vaut 2', () => {
    expect(DEFAULT_DIVERSITY_CAP).toBe(2)
  })
})
