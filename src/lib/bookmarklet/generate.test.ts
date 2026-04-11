import { describe, it, expect } from 'vitest'
import { generateBookmarkletCode } from './generate'

const TOKEN = 'dst_' + 'a'.repeat(64)
const BASE_URL = 'https://distil.app'

describe('generateBookmarkletCode', () => {
  it('commence par javascript:', () => {
    expect(generateBookmarkletCode(TOKEN, BASE_URL)).toMatch(/^javascript:/)
  })

  it('contient le token encode', () => {
    const code = generateBookmarkletCode(TOKEN, BASE_URL)
    expect(decodeURIComponent(code)).toContain(TOKEN)
  })

  it('contient l URL de base de l API', () => {
    const code = generateBookmarkletCode(TOKEN, BASE_URL)
    expect(decodeURIComponent(code)).toContain(`${BASE_URL}/api/articles/save`)
  })

  it('deux tokens differents produisent deux bookmarklets differents', () => {
    const token2 = 'dst_' + 'b'.repeat(64)
    expect(generateBookmarkletCode(TOKEN, BASE_URL)).not.toBe(
      generateBookmarkletCode(token2, BASE_URL)
    )
  })

  it('le code decodé ne contient pas de guillemets non echappes qui casseraient href', () => {
    const code = generateBookmarkletCode(TOKEN, BASE_URL)
    // Le javascript: URL est encode - pas de guillemets simples non echappes dans la partie encodee
    expect(code).not.toMatch(/javascript:[^%]*'/)
  })
})
