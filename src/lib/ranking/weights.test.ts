import { describe, it, expect } from 'vitest'
import {
  computeRssRatio,
  resolveRssRatio,
  RSS_RATIO_FLOOR,
  RSS_RATIO_CEILING,
  RSS_POOL_TARGET_MULTIPLIER,
  RSS_RATIO_CEILING_SOURCES_FIRST,
  SOURCES_FIRST_RSS_SUFFICIENCY,
  RSS_RELEVANCE_DISTANCE_MAX,
} from './weights'

describe('constantes', () => {
  it('plancher 0.25, plafond actif 0.75, multiplicateur 2', () => {
    expect(RSS_RATIO_FLOOR).toBe(0.25)
    expect(RSS_RATIO_CEILING).toBe(0.75)
    expect(RSS_POOL_TARGET_MULTIPLIER).toBe(2)
  })

  it('plafond sources_first 0.95 et seuil skip 1.5', () => {
    expect(RSS_RATIO_CEILING_SOURCES_FIRST).toBe(0.95)
    expect(SOURCES_FIRST_RSS_SUFFICIENCY).toBe(1.5)
  })

  it('distance cosine pertinente max 0.5', () => {
    expect(RSS_RELEVANCE_DISTANCE_MAX).toBe(0.5)
  })
})

describe('computeRssRatio', () => {
  it('pool sature (>= dailyCap * 2) => plafond 0.75', () => {
    expect(computeRssRatio({ rssAvailable: 30, dailyCap: 8 })).toBe(RSS_RATIO_CEILING)
    expect(computeRssRatio({ rssAvailable: 1000, dailyCap: 8 })).toBe(RSS_RATIO_CEILING)
  })

  it('pool vide => plancher 0.25', () => {
    expect(computeRssRatio({ rssAvailable: 0, dailyCap: 8 })).toBe(RSS_RATIO_FLOOR)
  })

  it('pool = dailyCap (moitie de target) => 0.5', () => {
    expect(computeRssRatio({ rssAvailable: 8, dailyCap: 8 })).toBe(0.5)
  })

  it('pool = dailyCap * 1.5 (3/4 target) => 0.75 (sature au plafond)', () => {
    expect(computeRssRatio({ rssAvailable: 12, dailyCap: 8 })).toBe(RSS_RATIO_CEILING)
  })

  it('dailyCap 0 ne divise pas par 0 (target >= 1)', () => {
    expect(computeRssRatio({ rssAvailable: 5, dailyCap: 0 })).toBe(RSS_RATIO_CEILING)
  })

  it('ratio reste dans [floor, ceiling]', () => {
    for (const rss of [0, 1, 4, 8, 16, 32, 100]) {
      const r = computeRssRatio({ rssAvailable: rss, dailyCap: 8 })
      expect(r).toBeGreaterThanOrEqual(RSS_RATIO_FLOOR)
      expect(r).toBeLessThanOrEqual(RSS_RATIO_CEILING)
    }
  })
})

describe('resolveRssRatio', () => {
  it('cold start force 1 meme en mode active avec pool vide', () => {
    expect(resolveRssRatio({ rssAvailable: 0, dailyCap: 8, mode: 'active', coldStart: true })).toBe(
      1
    )
  })

  it('mode active applique la formule standard (clampe au plafond 0.75)', () => {
    expect(resolveRssRatio({ rssAvailable: 100, dailyCap: 8, mode: 'active' })).toBe(
      RSS_RATIO_CEILING
    )
    expect(resolveRssRatio({ rssAvailable: 0, dailyCap: 8, mode: 'active' })).toBe(RSS_RATIO_FLOOR)
  })

  it('mode sources_first force 1 si rssAvailable >= dailyCap', () => {
    expect(resolveRssRatio({ rssAvailable: 8, dailyCap: 8, mode: 'sources_first' })).toBe(1)
    expect(resolveRssRatio({ rssAvailable: 20, dailyCap: 8, mode: 'sources_first' })).toBe(1)
  })

  it('mode sources_first en dessous du seuil applique la formule non clampee au ceiling actif', () => {
    // rssAvailable < dailyCap => raw = 7/16 = 0.4375 (entre floor 0.25 et ceiling sources_first 0.95)
    const r = resolveRssRatio({ rssAvailable: 7, dailyCap: 8, mode: 'sources_first' })
    expect(r).toBeCloseTo(0.4375, 4)
    expect(r).toBeLessThanOrEqual(RSS_RATIO_CEILING_SOURCES_FIRST)
    expect(r).toBeGreaterThanOrEqual(RSS_RATIO_FLOOR)
  })

  it('mode sources_first respecte le plancher 0.25 avec pool vide', () => {
    expect(resolveRssRatio({ rssAvailable: 0, dailyCap: 8, mode: 'sources_first' })).toBe(
      RSS_RATIO_FLOOR
    )
  })
})
