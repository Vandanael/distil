import { describe, it, expect } from 'vitest'
import {
  dayOfYear,
  ensureMinCategories,
  inferCategories,
  MIN_CATEGORIES,
  pickRotating,
} from './discovery-agent'
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

describe('ensureMinCategories', () => {
  it('ne modifie pas une liste qui atteint deja le plancher', () => {
    const input = ['tech', 'produit', 'ia', 'culture'] as const
    const result = ensureMinCategories([...input], 42)
    expect(result).toEqual(input)
  })

  it('complete jusqu a MIN_CATEGORIES si la liste est trop courte', () => {
    const result = ensureMinCategories(['tech'], 1)
    expect(result.length).toBeGreaterThanOrEqual(MIN_CATEGORIES)
    expect(result[0]).toBe('tech')
  })

  it('complete une liste vide jusqu au plancher', () => {
    const result = ensureMinCategories([], 1)
    expect(result.length).toBe(MIN_CATEGORIES)
  })

  it('n introduit pas de doublon avec les categories inferees', () => {
    const input = ['politique', 'cuisine']
    const result = ensureMinCategories(input as never, 1)
    const unique = new Set(result)
    expect(unique.size).toBe(result.length)
  })

  it('est deterministe sur un meme seed', () => {
    const a = ensureMinCategories(['tech'], 123)
    const b = ensureMinCategories(['tech'], 123)
    expect(a).toEqual(b)
  })

  it('produit des completions differentes sur des seeds differents', () => {
    const a = ensureMinCategories(['tech'], 1)
    const b = ensureMinCategories(['tech'], 5)
    expect(a).not.toEqual(b)
  })
})
