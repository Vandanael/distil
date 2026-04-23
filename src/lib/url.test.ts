import { describe, it, expect } from 'vitest'
import { extractDomain } from './url'

describe('extractDomain', () => {
  it('extrait le domaine sans www', () => {
    expect(extractDomain('https://www.example.com/article/1')).toBe('example.com')
  })

  it('extrait le domaine sans www prefix', () => {
    expect(extractDomain('https://example.com/path')).toBe('example.com')
  })

  it('supprime le path', () => {
    expect(extractDomain('https://blog.example.co.uk/deep/path?q=1')).toBe('blog.example.co.uk')
  })

  it('supprime le port (hostname only)', () => {
    expect(extractDomain('http://localhost:3000/test')).toBe('localhost')
  })

  it('retourne l\'input si URL invalide', () => {
    expect(extractDomain('not-a-url')).toBe('not-a-url')
    expect(extractDomain('')).toBe('')
  })
})