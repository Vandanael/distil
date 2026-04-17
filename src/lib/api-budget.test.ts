import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock @supabase/supabase-js avant le module sous test.
// createClient retourne un client qui enregistre les appels pour assertion.
const rpcCalls: Array<{ name: string; args: unknown }> = []
const selectSingleResult: { data: { calls_used: number } | null } = { data: null }
let rpcReturnValue: number = 0

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve(selectSingleResult),
          }),
        }),
      }),
    }),
    rpc: (name: string, args: unknown) => {
      rpcCalls.push({ name, args })
      return Promise.resolve({ data: rpcReturnValue, error: null })
    },
  }),
}))

beforeEach(() => {
  rpcCalls.length = 0
  selectSingleResult.data = null
  rpcReturnValue = 0
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-key')
  vi.resetModules()
})

describe('api-budget', () => {
  it('recordProviderCall appelle le RPC increment_api_budget avec le bon provider', async () => {
    const { recordProviderCall } = await import('./api-budget')
    await recordProviderCall('gemini')

    expect(rpcCalls).toHaveLength(1)
    expect(rpcCalls[0].name).toBe('increment_api_budget')
    const args = rpcCalls[0].args as Record<string, unknown>
    expect(args.p_provider).toBe('gemini')
    expect(args.p_increment).toBe(1)
    expect(args.p_limit).toBe(20) // gemini limit
  })

  it('recordProviderCall resync le compteur memoire quand la DB renvoie une valeur superieure', async () => {
    // Simule 2 process concurrents : autre process a deja appele 15 fois
    rpcReturnValue = 15
    const { recordProviderCall, assertBudget, BudgetExceededError } = await import('./api-budget')

    await recordProviderCall('gemini')
    // Counter memoire devrait etre 15 (DB) pas 1 (memoire)
    // Si on appelle 5 fois de plus et le budget est 20, on doit lever sur le 6e
    rpcReturnValue = 16
    await recordProviderCall('gemini')
    rpcReturnValue = 17
    await recordProviderCall('gemini')
    rpcReturnValue = 18
    await recordProviderCall('gemini')
    rpcReturnValue = 19
    await recordProviderCall('gemini')
    rpcReturnValue = 20
    await recordProviderCall('gemini')

    // Le prochain assertBudget doit refuser
    await expect(assertBudget('gemini')).rejects.toThrow(BudgetExceededError)
  })

  it('assertBudget hydrate le compteur depuis la DB au premier appel', async () => {
    // Simule un cold start : DB a deja 20 appels enregistres (limit atteinte)
    selectSingleResult.data = { calls_used: 20 }
    const { assertBudget, BudgetExceededError } = await import('./api-budget')

    await expect(assertBudget('gemini')).rejects.toThrow(BudgetExceededError)
  })

  it('assertBudget passe quand la DB est sous la limite', async () => {
    selectSingleResult.data = { calls_used: 5 }
    const { assertBudget } = await import('./api-budget')

    await expect(assertBudget('gemini')).resolves.toBeUndefined()
  })

  it('recordProviderCall ne throw pas si Supabase n est pas configure', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '')
    const { recordProviderCall } = await import('./api-budget')

    await expect(recordProviderCall('voyage')).resolves.toBeUndefined()
    expect(rpcCalls).toHaveLength(0)
  })
})
