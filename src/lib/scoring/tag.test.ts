import { describe, it, expect } from 'vitest'
import { scoreToTag } from './tag'

describe('scoreToTag', () => {
  it('retourne match_strong pour score >= 80', () => {
    expect(scoreToTag(80, false)).toBe('match_strong')
    expect(scoreToTag(95, false)).toBe('match_strong')
    expect(scoreToTag(100, false)).toBe('match_strong')
  })

  it('retourne match pour score entre 60 et 79', () => {
    expect(scoreToTag(60, false)).toBe('match')
    expect(scoreToTag(70, false)).toBe('match')
    expect(scoreToTag(79, false)).toBe('match')
  })

  it('retourne null pour score < 60', () => {
    expect(scoreToTag(59, false)).toBeNull()
    expect(scoreToTag(0, false)).toBeNull()
  })

  it('retourne discovery quand serendipity quel que soit le score', () => {
    expect(scoreToTag(10, true)).toBe('discovery')
    expect(scoreToTag(95, true)).toBe('discovery')
    expect(scoreToTag(null, true)).toBe('discovery')
  })

  it('retourne null pour score null/undefined sans serendipity', () => {
    expect(scoreToTag(null, false)).toBeNull()
    expect(scoreToTag(undefined, false)).toBeNull()
  })
})
