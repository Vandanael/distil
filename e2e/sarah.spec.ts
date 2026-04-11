/**
 * Parcours Sarah - dev junior, sauvegarde un article via le bookmarklet (API token).
 * Verifie que la route POST /api/articles/save accepte un token valide
 * et rejette un token invalide.
 */
import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:3000'

test.describe('Sarah - bookmarklet API', () => {
  test('rejet sans token : 401', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/articles/save`, {
      data: { url: 'https://example.com/article' },
    })
    expect(res.status()).toBe(401)
    const body = (await res.json()) as { error?: string }
    expect(body.error).toBeTruthy()
  })

  test('rejet avec token malformate : 401', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/articles/save`, {
      headers: { Authorization: 'Bearer not-a-valid-token' },
      data: { url: 'https://example.com/article' },
    })
    expect(res.status()).toBe(401)
  })

  test('CORS preflight OPTIONS : 204', async ({ request }) => {
    const res = await request.fetch(`${BASE_URL}/api/articles/save`, {
      method: 'OPTIONS',
    })
    expect(res.status()).toBe(204)
    expect(res.headers()['access-control-allow-origin']).toBe('*')
    expect(res.headers()['access-control-allow-methods']).toContain('POST')
  })
})
