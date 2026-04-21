import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { toggleDiscoveryMode } from './actions'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

function makeSupabaseMock(opts: { user: { id: string } | null; updateError?: string | null }) {
  const updates: Record<string, unknown>[] = []
  const eqCalls: Array<[string, string]> = []
  const client = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: opts.user }, error: null }),
    },
    from: vi.fn((table: string) => {
      if (table !== 'profiles') throw new Error(`Unexpected table: ${table}`)
      return {
        update: (payload: Record<string, unknown>) => {
          updates.push(payload)
          return {
            eq: (col: string, val: string) => {
              eqCalls.push([col, val])
              return Promise.resolve({
                error: opts.updateError ? { message: opts.updateError } : null,
              })
            },
          }
        },
      }
    }),
  }
  return { client, updates, eqCalls }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('toggleDiscoveryMode', () => {
  it('update profiles.discovery_mode et revalide les chemins', async () => {
    const mock = makeSupabaseMock({ user: { id: 'user-123' } })
    vi.mocked(createClient).mockResolvedValue(
      mock.client as unknown as Awaited<ReturnType<typeof createClient>>
    )

    await toggleDiscoveryMode('sources_first')

    expect(mock.updates).toEqual([{ discovery_mode: 'sources_first' }])
    expect(mock.eqCalls).toEqual([['id', 'user-123']])
    expect(revalidatePath).toHaveBeenCalledWith('/profile')
    expect(revalidatePath).toHaveBeenCalledWith('/feed')
  })

  it('accepte le mode active', async () => {
    const mock = makeSupabaseMock({ user: { id: 'user-abc' } })
    vi.mocked(createClient).mockResolvedValue(
      mock.client as unknown as Awaited<ReturnType<typeof createClient>>
    )

    await toggleDiscoveryMode('active')

    expect(mock.updates).toEqual([{ discovery_mode: 'active' }])
  })

  it('rejette quand user non authentifie', async () => {
    const mock = makeSupabaseMock({ user: null })
    vi.mocked(createClient).mockResolvedValue(
      mock.client as unknown as Awaited<ReturnType<typeof createClient>>
    )

    await expect(toggleDiscoveryMode('active')).rejects.toThrow('Non authentifie')
    expect(mock.updates).toHaveLength(0)
  })

  it('propage l erreur Supabase', async () => {
    const mock = makeSupabaseMock({
      user: { id: 'user-err' },
      updateError: 'permission denied',
    })
    vi.mocked(createClient).mockResolvedValue(
      mock.client as unknown as Awaited<ReturnType<typeof createClient>>
    )

    await expect(toggleDiscoveryMode('sources_first')).rejects.toThrow('permission denied')
  })
})
