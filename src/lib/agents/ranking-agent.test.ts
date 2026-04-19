import { describe, it, expect } from 'vitest'
import { enforceMinRelevance, MIN_Q1_RELEVANCE } from './ranking-agent'

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
