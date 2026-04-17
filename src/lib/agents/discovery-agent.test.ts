import { describe, it, expect } from 'vitest'
import { dayOfYear, inferCategories, pickRotating } from './discovery-agent'
import type { UserProfile } from './types'

function makeProfile(partial: Partial<UserProfile>): UserProfile {
  return {
    profileText: null,
    profileStructured: null,
    sector: null,
    interests: [],
    pinnedSources: [],
    dailyCap: 10,
    serendipityQuota: 0.15,
    ...partial,
  }
}

describe('dayOfYear', () => {
  it('retourne 1 pour le 1er janvier UTC', () => {
    expect(dayOfYear(new Date('2026-01-01T00:00:00Z'))).toBe(1)
  })

  it('retourne 365 pour le 31 decembre d une annee non bissextile', () => {
    expect(dayOfYear(new Date('2026-12-31T12:00:00Z'))).toBe(365)
  })

  it('ignore l heure - meme jour = meme resultat', () => {
    expect(dayOfYear(new Date('2026-04-17T00:00:00Z'))).toBe(
      dayOfYear(new Date('2026-04-17T23:59:59Z'))
    )
  })
})

describe('pickRotating', () => {
  const pool = ['a', 'b', 'c', 'd', 'e']

  it('retourne des elements differents a des jours successifs', () => {
    const day1 = pickRotating(pool, 2, 1)
    const day2 = pickRotating(pool, 2, 2)
    const day3 = pickRotating(pool, 2, 3)

    expect(day1).toEqual(['b', 'c'])
    expect(day2).toEqual(['c', 'd'])
    expect(day3).toEqual(['d', 'e'])
  })

  it('wrap autour a la fin du pool', () => {
    expect(pickRotating(pool, 2, 4)).toEqual(['e', 'a'])
    expect(pickRotating(pool, 3, 4)).toEqual(['e', 'a', 'b'])
  })

  it('retourne tout le pool si count >= pool.length', () => {
    expect(pickRotating(pool, 5, 0)).toEqual(pool)
    expect(pickRotating(pool, 10, 0)).toEqual(pool)
  })

  it('retourne [] pour un pool vide', () => {
    expect(pickRotating([], 2, 0)).toEqual([])
  })

  it('est deterministe : meme seed = meme resultat', () => {
    const a = pickRotating(pool, 2, 42)
    const b = pickRotating(pool, 2, 42)
    expect(a).toEqual(b)
  })

  it('gere un seed negatif', () => {
    expect(pickRotating(pool, 2, -1)).toEqual(['e', 'a'])
  })
})

describe('inferCategories', () => {
  it('matche le profil tech + cuisine + geopolitique + culture de Yvan', () => {
    const cats = inferCategories(
      makeProfile({
        profileText:
          "PM Senior dans la tech, j'aime les jeux video, la musique, la fantasy ou sf et la cuisine. J'aime aussi la geopolitique et les infos pratiques.",
        interests: ['Product', 'games', 'music', 'cooking', 'tech'],
      })
    )
    expect(cats).toEqual(
      expect.arrayContaining(['tech', 'produit', 'cuisine', 'politique', 'culture'])
    )
  })

  it('retourne [] si aucun mot cle ne matche', () => {
    expect(inferCategories(makeProfile({ profileText: 'xyzzyvrt qwerty' }))).toEqual([])
  })

  it('ignore les accents dans les mots cles', () => {
    expect(inferCategories(makeProfile({ interests: ['géopolitique'] }))).toContain('politique')
  })
})
