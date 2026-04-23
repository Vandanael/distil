import { describe, it, expect } from 'vitest'
import { buildRankingUserPrompt, RANKING_SYSTEM_PROMPT } from './ranking-prompts'
import type { RankingCandidate } from './ranking-types'

function baseCandidate(overrides: Partial<RankingCandidate> = {}): RankingCandidate {
  return {
    itemId: 'item-1',
    url: 'https://example.test/1',
    title: 'Un titre',
    author: null,
    siteName: 'example.test',
    publishedAt: null,
    contentPreview: 'Extrait de contenu',
    wordCount: 500,
    distance: 0.3,
    unpopScore: 0.5,
    isKeywordHit: false,
    matchedKeywords: [],
    keywordRank: 0,
    sourceKind: 'rss',
    ...overrides,
  }
}

const emptyProfile = {
  staticProfile: null,
  longTermProfile: null,
  shortTermProfile: null,
  fallbackText: 'Profil test',
}

describe('buildRankingUserPrompt - prefixe [MATCH]', () => {
  it("n'ajoute pas de prefixe [MATCH] si isKeywordHit=false", () => {
    const c = baseCandidate({ isKeywordHit: false, matchedKeywords: [] })
    const out = buildRankingUserPrompt(emptyProfile, [c])
    expect(out.prompt).not.toContain('[MATCH')
    expect(out.prompt).toContain('[1]')
  })

  it('prefixe [MATCH:kw1,kw2] si isKeywordHit=true avec matchedKeywords non vide', () => {
    const c = baseCandidate({ isKeywordHit: true, matchedKeywords: ['ai agents', 'llm'] })
    const out = buildRankingUserPrompt(emptyProfile, [c])
    expect(out.prompt).toContain('[MATCH:ai agents,llm]')
    expect(out.prompt).toContain('[1]')
  })

  it("n'ajoute pas le prefixe si matchedKeywords est vide, meme avec isKeywordHit=true", () => {
    // Cas defensif : si le flag est true mais le tableau vide, on ne fabrique pas un [MATCH:] vide.
    const c = baseCandidate({ isKeywordHit: true, matchedKeywords: [] })
    const out = buildRankingUserPrompt(emptyProfile, [c])
    expect(out.prompt).not.toContain('[MATCH')
  })
})

describe('RANKING_SYSTEM_PROMPT - regle [MATCH]', () => {
  it('documente la regle [MATCH]', () => {
    expect(RANKING_SYSTEM_PROMPT).toContain('[MATCH')
    expect(RANKING_SYSTEM_PROMPT).toMatch(/Q1\s*<\s*6/)
  })
})

describe('buildRankingUserPrompt - suffixe ref', () => {
  it('ajoute ", ref" pour une source de reference', () => {
    const c = baseCandidate({ siteName: 'lemonde.fr' })
    const out = buildRankingUserPrompt(emptyProfile, [c])
    expect(out.prompt).toMatch(/\d+ mots, ref \|/)
  })

  it('pas de suffixe ref pour une source non listee', () => {
    const c = baseCandidate({ siteName: 'blog-random.test' })
    const out = buildRankingUserPrompt(emptyProfile, [c])
    expect(out.prompt).not.toContain(', ref')
  })
})

describe('RANKING_SYSTEM_PROMPT - densite + ref', () => {
  it('documente la regle densite et ref', () => {
    expect(RANKING_SYSTEM_PROMPT).toMatch(/800 mots/)
    expect(RANKING_SYSTEM_PROMPT).toMatch(/references etablies/)
  })
})

describe('buildRankingUserPrompt - signaux recents', () => {
  it('injecte les appreciations positives avec titre et site', () => {
    const out = buildRankingUserPrompt(emptyProfile, [baseCandidate()], {
      positive: [{ title: 'Article aime', siteName: 'stratechery.com' }],
      rejected: [],
    })
    expect(out.prompt).toContain('SIGNAUX RECENTS')
    expect(out.prompt).toContain('Appreciations explicites')
    expect(out.prompt).toContain('Article aime | stratechery.com')
  })

  it('injecte les rejets avec titre et site', () => {
    const out = buildRankingUserPrompt(emptyProfile, [baseCandidate()], {
      positive: [],
      rejected: [{ title: 'Article rejete', siteName: 'random.blog' }],
    })
    expect(out.prompt).toContain('Articles rejetes')
    expect(out.prompt).toContain('Article rejete | random.blog')
  })

  it("n'ajoute pas de bloc signaux si listes vides", () => {
    const out = buildRankingUserPrompt(emptyProfile, [baseCandidate()], {
      positive: [],
      rejected: [],
    })
    expect(out.prompt).not.toContain('SIGNAUX RECENTS')
  })

  it("n'ajoute pas de bloc signaux si argument omis", () => {
    const out = buildRankingUserPrompt(emptyProfile, [baseCandidate()])
    expect(out.prompt).not.toContain('SIGNAUX RECENTS')
  })

  it('tronque a 20 signaux par bucket', () => {
    const many = Array.from({ length: 30 }, (_, i) => ({
      title: `Titre ${i}`,
      siteName: 'ex.com',
    }))
    const out = buildRankingUserPrompt(emptyProfile, [baseCandidate()], {
      positive: many,
      rejected: [],
    })
    expect(out.prompt).toContain('Titre 0 | ex.com')
    expect(out.prompt).toContain('Titre 19 | ex.com')
    expect(out.prompt).not.toContain('Titre 20 | ex.com')
  })
})

describe('buildRankingUserPrompt - indexMap', () => {
  it('construit un indexMap index→uuid correct (1-base)', () => {
    const c1 = baseCandidate({ itemId: 'uuid-alpha' })
    const c2 = baseCandidate({ itemId: 'uuid-beta' })
    const { indexMap } = buildRankingUserPrompt(emptyProfile, [c1, c2])
    expect(indexMap.get(1)).toBe('uuid-alpha')
    expect(indexMap.get(2)).toBe('uuid-beta')
    expect(indexMap.size).toBe(2)
  })

  it('utilise les indices numeriques dans le prompt, pas les UUIDs', () => {
    const c = baseCandidate({ itemId: 'some-uuid-here' })
    const { prompt } = buildRankingUserPrompt(emptyProfile, [c])
    expect(prompt).toContain('[1]')
    expect(prompt).not.toContain('some-uuid-here')
  })
})
