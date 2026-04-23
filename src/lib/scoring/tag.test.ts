import { describe, it, expect } from 'vitest'
import { scoreToTag } from './tag'

describe('scoreToTag', () => {
  it('retourne discovery quand bucket=surprise, quel que soit le score', () => {
    expect(scoreToTag(10, 'surprise', false, 'feed')).toBe('discovery')
    expect(scoreToTag(95, 'surprise', false, 'feed')).toBe('discovery')
    expect(scoreToTag(null, 'surprise', false, 'feed')).toBe('discovery')
  })

  it('retourne relevant quand bucket=essential', () => {
    expect(scoreToTag(80, 'essential', false, 'feed')).toBe('relevant')
    expect(scoreToTag(40, 'essential', false, 'feed')).toBe('relevant')
  })

  it('fallback sur isSerendipity quand bucket=null', () => {
    expect(scoreToTag(50, null, true, 'feed')).toBe('discovery')
    expect(scoreToTag(10, null, true, 'feed')).toBe('discovery')
  })

  it('fallback sur score >= 60 quand bucket=null et pas serendipity', () => {
    expect(scoreToTag(80, null, false, 'feed')).toBe('relevant')
    expect(scoreToTag(60, null, false, 'feed')).toBe('relevant')
  })

  it('retourne null quand score < 60 et pas serendipity', () => {
    expect(scoreToTag(40, null, false, 'feed')).toBeNull()
    expect(scoreToTag(0, null, false, 'feed')).toBeNull()
    expect(scoreToTag(null, null, false, 'feed')).toBeNull()
  })

  it('retourne null pour origin=bookmarklet, prioritaire sur tout', () => {
    expect(scoreToTag(95, 'essential', false, 'bookmarklet')).toBeNull()
    expect(scoreToTag(95, 'surprise', true, 'bookmarklet')).toBeNull()
  })
})
