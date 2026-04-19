import { describe, it, expect } from 'vitest'
import {
  enforceMinRelevance,
  MIN_Q1_RELEVANCE,
  applyCosineGuard,
  MAX_ESSENTIAL_DISTANCE,
  HIGH_RELEVANCE_Q1,
} from './ranking-agent'
import type { RankingCandidate } from './ranking-types'

function candidate(itemId: string, distance: number): RankingCandidate {
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
