// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { generateToken, hashToken, validateTokenFormat } from './api-tokens'

describe('generateToken', () => {
  it('commence par dst_', () => {
    expect(generateToken()).toMatch(/^dst_/)
  })

  it('fait exactement 68 caracteres', () => {
    expect(generateToken()).toHaveLength(68)
  })

  it('produit deux tokens differents a chaque appel', () => {
    expect(generateToken()).not.toBe(generateToken())
  })

  it('ne contient que des caracteres hexadecimaux apres le prefixe', () => {
    const token = generateToken()
    expect(token.slice(4)).toMatch(/^[0-9a-f]{64}$/)
  })
})

describe('hashToken', () => {
  it('est deterministe : meme input meme output', async () => {
    const token = 'dst_' + 'a'.repeat(64)
    const hash1 = await hashToken(token)
    const hash2 = await hashToken(token)
    expect(hash1).toBe(hash2)
  })

  it('produit une string de 64 chars hex', async () => {
    const hash = await hashToken('dst_test')
    expect(hash).toHaveLength(64)
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
  })

  it('deux tokens differents produisent deux hashes differents', async () => {
    const h1 = await hashToken(generateToken())
    const h2 = await hashToken(generateToken())
    expect(h1).not.toBe(h2)
  })
})

describe('validateTokenFormat', () => {
  it('accepte un token valide', () => {
    const token = generateToken()
    expect(validateTokenFormat(token)).toBe(true)
  })

  it('rejette un token sans prefixe dst_', () => {
    expect(validateTokenFormat('abc_' + 'a'.repeat(64))).toBe(false)
  })

  it('rejette un token trop court', () => {
    expect(validateTokenFormat('dst_abc')).toBe(false)
  })

  it('rejette null', () => {
    expect(validateTokenFormat(null)).toBe(false)
  })

  it('rejette undefined', () => {
    expect(validateTokenFormat(undefined)).toBe(false)
  })
})
