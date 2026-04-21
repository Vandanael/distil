import { describe, it, expect } from 'vitest'
import {
  normalizeLangCode,
  extractLanguageFromHtml,
  detectLanguageHeuristic,
  resolveLanguage,
} from './language'

describe('normalizeLangCode', () => {
  it('retourne fr pour fr', () => {
    expect(normalizeLangCode('fr')).toBe('fr')
  })

  it('retourne fr pour fr-FR', () => {
    expect(normalizeLangCode('fr-FR')).toBe('fr')
  })

  it('retourne fr pour fr_CA', () => {
    expect(normalizeLangCode('fr_CA')).toBe('fr')
  })

  it('retourne fr pour FR (uppercase)', () => {
    expect(normalizeLangCode('FR')).toBe('fr')
  })

  it('retourne en pour en-US', () => {
    expect(normalizeLangCode('en-US')).toBe('en')
  })

  it('retourne null pour de', () => {
    expect(normalizeLangCode('de')).toBeNull()
  })

  it('retourne null pour es', () => {
    expect(normalizeLangCode('es')).toBeNull()
  })

  it('retourne null pour null/undefined/vide', () => {
    expect(normalizeLangCode(null)).toBeNull()
    expect(normalizeLangCode(undefined)).toBeNull()
    expect(normalizeLangCode('')).toBeNull()
  })
})

describe('extractLanguageFromHtml', () => {
  it('extrait fr depuis attribut lang normalisé', () => {
    expect(extractLanguageFromHtml('fr-FR')).toBe('fr')
  })

  it('extrait en depuis attribut lang EN', () => {
    expect(extractLanguageFromHtml('en')).toBe('en')
  })

  it('retourne null pour lang non supporté', () => {
    expect(extractLanguageFromHtml('zh-CN')).toBeNull()
  })

  it('retourne null si attribut absent', () => {
    expect(extractLanguageFromHtml(null)).toBeNull()
  })
})

describe('detectLanguageHeuristic', () => {
  it('detecte fr sur texte francais typique', () => {
    const text =
      "L'article parle de la technologie et de la pour les utilisateurs dans une nouvelle ere. Les outils sont des aides pour le travail."
    expect(detectLanguageHeuristic(text)).toBe('fr')
  })

  it('detecte en sur texte anglais typique', () => {
    const text =
      'The article talks about technology and about the users in a new era. The tools are helpers for the work.'
    expect(detectLanguageHeuristic(text)).toBe('en')
  })

  it('retourne en pour texte vide', () => {
    expect(detectLanguageHeuristic('')).toBe('en')
  })

  it('detecte fr meme si les mots FR sont au-dela du seuil dans les 1000 premiers chars', () => {
    // 3 occurrences minimum: le, la, des
    const text = 'le chat dort. la maison est calme. des oiseaux chantent au jardin.'
    expect(detectLanguageHeuristic(text)).toBe('fr')
  })

  it('ne detecte pas fr si moins de 3 mots-outils FR', () => {
    // seulement 'le'
    const text = 'le quick brown fox jumps over the lazy dog every single time with energy'
    expect(detectLanguageHeuristic(text)).toBe('en')
  })
})

describe('resolveLanguage (cascade)', () => {
  it('niveau 1 prioritaire : htmlLang gagne meme si contenu FR', () => {
    const result = resolveLanguage({
      htmlLang: 'en',
      contentText: 'Le chat dort dans la maison des voisins pour la journee.',
      profileLanguage: 'fr',
    })
    expect(result).toBe('en')
  })

  it('niveau 2 : heuristique utilisee quand htmlLang absent', () => {
    const result = resolveLanguage({
      htmlLang: null,
      contentText: 'Le chat dort dans la maison des voisins pour la journee.',
      profileLanguage: 'en',
    })
    expect(result).toBe('fr')
  })

  it('niveau 2 : heuristique sur contenu anglais', () => {
    const result = resolveLanguage({
      htmlLang: null,
      contentText: 'The cat sleeps in the house of the neighbors for the day.',
      profileLanguage: 'fr',
    })
    expect(result).toBe('en')
  })

  it('niveau 3 : fallback profileLanguage si contentText trop court', () => {
    const result = resolveLanguage({
      htmlLang: null,
      contentText: 'short',
      profileLanguage: 'fr',
    })
    expect(result).toBe('fr')
  })

  it('niveau 3 : defaut en si profileLanguage=both', () => {
    const result = resolveLanguage({
      htmlLang: null,
      contentText: 'short',
      profileLanguage: 'both',
    })
    expect(result).toBe('en')
  })

  it('niveau 3 : defaut en si profileLanguage null et content vide', () => {
    const result = resolveLanguage({
      htmlLang: null,
      contentText: '',
      profileLanguage: null,
    })
    expect(result).toBe('en')
  })

  it('ignore htmlLang non supporte et passe au niveau 2', () => {
    const result = resolveLanguage({
      htmlLang: 'zh-CN',
      contentText: 'Le chat dort dans la maison des voisins pour la journee.',
      profileLanguage: null,
    })
    expect(result).toBe('fr')
  })
})
