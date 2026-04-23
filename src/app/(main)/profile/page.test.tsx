import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

const mockSignOut = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: () =>
    Promise.resolve({
      auth: {
        getUser: () =>
          Promise.resolve({ data: { user: { id: 'u1' } } }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () =>
              Promise.resolve({
                data: null,
                error: { code: '42703', message: 'column does not exist' },
              }),
          }),
        }),
      }),
    }),
}))

vi.mock('next/navigation', () => ({
  redirect: () => {
    throw new Error('redirect called')
  },
}))

describe('ProfilePage - erreur technique', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'
  })

  it('affiche un bandeau erreur si Supabase retourne 42703 au lieu de redirect', async () => {
    const { default: ProfilePage } = await import('./page')
    render(await ProfilePage())
    expect(
      screen.getByText(/Profil temporairement indisponible/)
    ).toBeTruthy()
  })
})