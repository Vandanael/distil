import { describe, it, expect } from 'vitest'
import { normalizeKeyword, splitInterestsFromCsv } from './keywords'

describe('normalizeKeyword', () => {
  it('lowercase les majuscules', () => {
    expect(normalizeKeyword('AI')).toBe('ai')
    expect(normalizeKeyword('Machine Learning')).toBe('machine learning')
  })

  it('retire les diacritiques via NFD', () => {
    expect(normalizeKeyword('geopolitique')).toBe('geopolitique')
    expect(normalizeKeyword('démocratie')).toBe('democratie')
    expect(normalizeKeyword('æ')).toBe('æ') // preserves non-decomposable chars
  })

  it('trim les espaces avant et apres', () => {
    expect(normalizeKeyword('  produit  ')).toBe('produit')
  })

  it('preserve les espaces internes', () => {
    expect(normalizeKeyword('ai agents')).toBe('ai agents')
  })

  it('retourne une chaine vide pour input vide ou espaces', () => {
    expect(normalizeKeyword('')).toBe('')
    expect(normalizeKeyword('   ')).toBe('')
  })
})

describe('splitInterestsFromCsv', () => {
  it('split basique + trim', () => {
    expect(splitInterestsFromCsv('ai, ml, produit')).toEqual(['ai', 'ml', 'produit'])
  })

  it('normalise chaque entree (lowercase + diacritics)', () => {
    expect(splitInterestsFromCsv('AI, Démocratie, Produit')).toEqual([
      'ai',
      'democratie',
      'produit',
    ])
  })

  it('dedup sur normalisation (AI == ai)', () => {
    expect(splitInterestsFromCsv('AI, ai, ML')).toEqual(['ai', 'ml'])
  })

  it('ignore les entrees vides', () => {
    expect(splitInterestsFromCsv('a, , b, ,,c')).toEqual(['a', 'b', 'c'])
  })

  it('input vide renvoie tableau vide', () => {
    expect(splitInterestsFromCsv('')).toEqual([])
    expect(splitInterestsFromCsv('   ')).toEqual([])
  })

  it('preserve ordre premiere occurrence', () => {
    expect(splitInterestsFromCsv('ml, ai, ml, produit')).toEqual(['ml', 'ai', 'produit'])
  })
})
