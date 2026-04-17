import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock @supabase/supabase-js : on capture les appels select/rpc et on contrôle
// la valeur retournée par table (api_budget_log vs api_budget_log_user).
const rpcCalls: Array<{ name: string; args: unknown }> = []
const selectResults: Record<string, { data: { calls_used: number } | null }> = {
  api_budget_log: { data: null },
  api_budget_log_user: { data: null },
}
let rpcReturnValue: number = 0

function makeEqChain(data: unknown): unknown {
  const chain = {
    eq: () => chain,
    maybeSingle: () => Promise.resolve({ data }),
  }
  return chain
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: (table: string) => ({
      select: () => makeEqChain(selectResults[table]?.data ?? null),
    }),
    rpc: (name: string, args: unknown) => {
      rpcCalls.push({ name, args })
      return Promise.resolve({ data: rpcReturnValue, error: null })
    },
  }),
}))

beforeEach(() => {
  rpcCalls.length = 0
  selectResults.api_budget_log = { data: null }
  selectResults.api_budget_log_user = { data: null }
  rpcReturnValue = 0
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-key')
  // Valeurs par defaut pour les limites (evite de dependre des env de dev).
  vi.stubEnv('API_BUDGET_GLOBAL_VOYAGE', '3000')
  vi.stubEnv('API_BUDGET_GLOBAL_GEMINI', '500')
  vi.stubEnv('API_BUDGET_USER_VOYAGE', '100')
  vi.stubEnv('API_BUDGET_USER_GEMINI', '30')
  vi.resetModules()
})

describe('api-budget global', () => {
  it('recordProviderCall appelle le RPC increment_api_budget avec le bon provider', async () => {
    const { recordProviderCall } = await import('./api-budget')
    await recordProviderCall('gemini')

    expect(rpcCalls).toHaveLength(1)
    expect(rpcCalls[0].name).toBe('increment_api_budget')
    const args = rpcCalls[0].args as Record<string, unknown>
    expect(args.p_provider).toBe('gemini')
    expect(args.p_increment).toBe(1)
    expect(args.p_limit).toBe(500)
  })

  it('recordProviderCall resync le compteur memoire quand la DB renvoie une valeur superieure', async () => {
    rpcReturnValue = 495
    const { recordProviderCall, assertBudget, BudgetExceededError } = await import('./api-budget')

    await recordProviderCall('gemini')
    rpcReturnValue = 496
    await recordProviderCall('gemini')
    rpcReturnValue = 497
    await recordProviderCall('gemini')
    rpcReturnValue = 498
    await recordProviderCall('gemini')
    rpcReturnValue = 499
    await recordProviderCall('gemini')
    rpcReturnValue = 500
    await recordProviderCall('gemini')

    await expect(assertBudget('gemini')).rejects.toThrow(BudgetExceededError)
  })

  it('assertBudget hydrate le compteur depuis la DB au premier appel', async () => {
    selectResults.api_budget_log = { data: { calls_used: 500 } }
    const { assertBudget, BudgetExceededError } = await import('./api-budget')

    await expect(assertBudget('gemini')).rejects.toThrow(BudgetExceededError)
  })

  it('assertBudget passe quand la DB est sous la limite', async () => {
    selectResults.api_budget_log = { data: { calls_used: 5 } }
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

describe('api-budget per-user', () => {
  const USER_ID = '11111111-1111-1111-1111-111111111111'

  it('assertUserBudget passe quand le user est sous la limite', async () => {
    selectResults.api_budget_log_user = { data: { calls_used: 5 } }
    const { assertUserBudget } = await import('./api-budget')

    await expect(assertUserBudget('gemini', USER_ID)).resolves.toBeUndefined()
  })

  it('assertUserBudget throw UserBudgetExceededError quand la limite user est atteinte', async () => {
    selectResults.api_budget_log_user = { data: { calls_used: 30 } }
    const { assertUserBudget, UserBudgetExceededError } = await import('./api-budget')

    await expect(assertUserBudget('gemini', USER_ID)).rejects.toThrow(UserBudgetExceededError)
  })

  it('recordUserProviderCall appelle le RPC increment_api_budget_user', async () => {
    const { recordUserProviderCall } = await import('./api-budget')
    await recordUserProviderCall('voyage', USER_ID, 2)

    expect(rpcCalls).toHaveLength(1)
    expect(rpcCalls[0].name).toBe('increment_api_budget_user')
    const args = rpcCalls[0].args as Record<string, unknown>
    expect(args.p_user_id).toBe(USER_ID)
    expect(args.p_provider).toBe('voyage')
    expect(args.p_increment).toBe(2)
    expect(args.p_limit).toBe(100)
  })

  it('assertUserBudget passe silencieusement si Supabase pas configure', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '')
    const { assertUserBudget } = await import('./api-budget')

    await expect(assertUserBudget('gemini', USER_ID)).resolves.toBeUndefined()
  })
})
