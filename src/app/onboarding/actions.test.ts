import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/lib/agents/ranking-agent', () => ({ rankForUser: vi.fn() }))
vi.mock('@/lib/ingestion/embed-items', () => ({ embedNewItems: vi.fn() }))
vi.mock('@/lib/errors/log-error', () => ({ logError: vi.fn() }))
vi.mock('@supabase/supabase-js', () => ({ createClient: vi.fn() }))

import { triggerFirstEditionRanking } from './actions'
import { rankForUser } from '@/lib/agents/ranking-agent'
import { embedNewItems } from '@/lib/ingestion/embed-items'
import { createClient } from '@supabase/supabase-js'
import type { RankingResult } from '@/lib/agents/ranking-types'

function makeResult(editionSize: number): RankingResult {
  return {
    userId: 'user-1',
    date: new Date().toISOString().slice(0, 10),
    essential: [],
    surprise: [],
    fallback: false,
    modelUsed: null,
    candidatesCount: 0,
    keywordHitsCount: 0,
    keywordHitsPromoted: 0,
    keywordHitsForceInjected: 0,
    editionSize,
    error: null,
    durationMs: 10,
    cosineP25: null,
    cosineP50: null,
    cosineP75: null,
    guardDowngrades: 0,
    diversityCapRejections: null,
  }
}

function makeSupabaseMock() {
  const profileUpdates: Record<string, unknown>[] = []
  const dailyRankingDeletes: number[] = []

  const mock = {
    from: vi.fn((table: string) => {
      if (table === 'profiles') {
        return {
          update: (data: Record<string, unknown>) => {
            profileUpdates.push(data)
            return { eq: () => Promise.resolve({ error: null }) }
          },
        }
      }
      if (table === 'daily_ranking') {
        return {
          delete: () => ({
            eq: () => ({
              eq: () => {
                dailyRankingDeletes.push(1)
                return Promise.resolve({ error: null })
              },
            }),
          }),
        }
      }
      if (table === 'articles') {
        return {
          delete: () => ({
            eq: () => ({
              gte: () => Promise.resolve({ error: null }),
            }),
          }),
        }
      }
      return {}
    }),
    _profileUpdates: profileUpdates,
    _dailyRankingDeletes: dailyRankingDeletes,
  }

  return mock
}

describe('triggerFirstEditionRanking', () => {
  let supabaseMock: ReturnType<typeof makeSupabaseMock>

  beforeEach(() => {
    vi.clearAllMocks()
    supabaseMock = makeSupabaseMock()
    vi.mocked(createClient).mockReturnValue(supabaseMock as never)
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-key')
    vi.mocked(embedNewItems).mockResolvedValue({
      itemsEmbedded: 0,
      popularityComputed: 0,
      rateLimited: false,
      error: null,
      durationMs: 0,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('branche 1 : ranking direct >= 5 → first_edition_empty false, no delete', async () => {
    vi.mocked(rankForUser).mockResolvedValueOnce(makeResult(6))

    await triggerFirstEditionRanking('user-1')

    expect(supabaseMock._profileUpdates).toContainEqual({ first_edition_empty: false })
    expect(supabaseMock._dailyRankingDeletes).toHaveLength(0)
    expect(vi.mocked(embedNewItems)).not.toHaveBeenCalled()
    expect(vi.mocked(rankForUser)).toHaveBeenCalledTimes(1)
  })

  it('branche 2 : fallback réussi → first_edition_empty false, embedNewItems appelé, delete exécuté', async () => {
    vi.mocked(rankForUser)
      .mockResolvedValueOnce(makeResult(3))
      .mockResolvedValueOnce(makeResult(7))

    await triggerFirstEditionRanking('user-1')

    expect(supabaseMock._profileUpdates).toContainEqual({ first_edition_empty: false })
    expect(vi.mocked(embedNewItems)).toHaveBeenCalledOnce()
    expect(supabaseMock._dailyRankingDeletes).toHaveLength(1)
    expect(vi.mocked(rankForUser)).toHaveBeenCalledTimes(2)
  })

  it('branche 3 : fallback échoué → first_edition_empty true, daily_ranking vidé', async () => {
    vi.mocked(rankForUser)
      .mockResolvedValueOnce(makeResult(2))
      .mockResolvedValueOnce(makeResult(1))

    await triggerFirstEditionRanking('user-1')

    expect(supabaseMock._profileUpdates).toContainEqual({ first_edition_empty: true })
    expect(supabaseMock._dailyRankingDeletes).toHaveLength(1)
    expect(vi.mocked(rankForUser)).toHaveBeenCalledTimes(2)
  })

  it('branche 4 : timeout 60s → first_edition_empty true', async () => {
    vi.useFakeTimers()
    vi.mocked(rankForUser).mockImplementation(() => new Promise(() => {}))

    const promise = triggerFirstEditionRanking('user-1')
    await vi.advanceTimersByTimeAsync(61_000)
    await promise

    expect(supabaseMock._profileUpdates).toContainEqual({ first_edition_empty: true })

    vi.useRealTimers()
  })
})
