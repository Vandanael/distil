import { createClient } from '@supabase/supabase-js'

/**
 * API budget guard - prevents unexpected bills by tracking daily API call counts.
 *
 * Two layers :
 * - Global cap (api_budget_log) : hard absolute limit across all users, prevents
 *   surprise-facture scenarios.
 * - Per-user cap (api_budget_log_user) : prevents one abusive user from draining
 *   the budget of others. Only enforced when userId is provided.
 *
 * Both caps reset at 00:00 UTC.
 *
 * Limits are configurable via env :
 * - API_BUDGET_GLOBAL_VOYAGE / API_BUDGET_GLOBAL_GEMINI (defaults: 3000 / 500)
 * - API_BUDGET_USER_VOYAGE / API_BUDGET_USER_GEMINI (defaults: 100 / 30)
 *
 * Persistance : compteur global en memoire (fast path) + RPC atomique (source de verite).
 * Le per-user skip le cache memoire et va direct en DB (quelques appels par user/jour, cache marginal).
 */

type Provider = 'voyage' | 'gemini'

function intEnv(name: string, fallback: number): number {
  const raw = process.env[name]
  if (!raw) return fallback
  const n = parseInt(raw, 10)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

const DAILY_LIMITS: Record<Provider, number> = {
  voyage: intEnv('API_BUDGET_GLOBAL_VOYAGE', 3000),
  gemini: intEnv('API_BUDGET_GLOBAL_GEMINI', 500),
}

const USER_DAILY_LIMITS: Record<Provider, number> = {
  voyage: intEnv('API_BUDGET_USER_VOYAGE', 100),
  gemini: intEnv('API_BUDGET_USER_GEMINI', 30),
}

const counters: Record<Provider, { date: string; count: number; hydrated: boolean }> = {
  voyage: { date: '', count: 0, hydrated: false },
  gemini: { date: '', count: 0, hydrated: false },
}

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10)
}

function getCounter(provider: Provider): { date: string; count: number; hydrated: boolean } {
  const today = todayUTC()
  const c = counters[provider]
  if (c.date !== today) {
    c.date = today
    c.count = 0
    c.hydrated = false
  }
  return c
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

async function hydrateFromDb(provider: Provider): Promise<void> {
  const c = getCounter(provider)
  if (c.hydrated) return
  c.hydrated = true

  const supabase = getSupabaseAdmin()
  if (!supabase) return

  const { data } = await supabase
    .from('api_budget_log')
    .select('calls_used')
    .eq('date', c.date)
    .eq('provider', provider)
    .maybeSingle()

  if (data) {
    c.count = Math.max(c.count, data.calls_used)
  }
}

async function canCallProvider(provider: Provider): Promise<boolean> {
  await hydrateFromDb(provider)
  const c = getCounter(provider)
  return c.count < DAILY_LIMITS[provider]
}

/**
 * Enregistre un appel provider global (increment atomique DB + memoire).
 */
export async function recordProviderCall(provider: Provider, calls: number = 1): Promise<void> {
  const c = getCounter(provider)
  c.count += calls

  const supabase = getSupabaseAdmin()
  if (!supabase) return

  const { data, error } = await supabase.rpc('increment_api_budget', {
    p_date: c.date,
    p_provider: provider,
    p_increment: calls,
    p_limit: DAILY_LIMITS[provider],
  })

  if (error) {
    const { logError } = await import('@/lib/errors/log-error')
    await logError({ route: 'api-budget.increment', error, context: { provider } })
    return
  }

  if (typeof data === 'number' && data > c.count) {
    c.count = data
  }
}

/**
 * Guard global - throws si budget global depasse.
 */
export async function assertBudget(provider: Provider): Promise<void> {
  if (!(await canCallProvider(provider))) {
    throw new BudgetExceededError(provider)
  }
}

/**
 * Guard per-user - throws si budget user pour aujourd'hui depasse.
 * Silencieux (passe) si Supabase non configure.
 */
export async function assertUserBudget(provider: Provider, userId: string): Promise<void> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return

  const { data, error } = await supabase
    .from('api_budget_log_user')
    .select('calls_used')
    .eq('date', todayUTC())
    .eq('user_id', userId)
    .eq('provider', provider)
    .maybeSingle()

  if (error) {
    const { logError } = await import('@/lib/errors/log-error')
    await logError({
      route: 'api-budget.assertUserBudget',
      error,
      userId,
      context: { provider },
    })
    return
  }

  const used = data?.calls_used ?? 0
  if (used >= USER_DAILY_LIMITS[provider]) {
    throw new UserBudgetExceededError(provider, userId)
  }
}

/**
 * Enregistre un appel provider pour un user (increment atomique DB).
 * Pas de cache memoire : le volume per-user est faible, la DB est source de verite.
 */
export async function recordUserProviderCall(
  provider: Provider,
  userId: string,
  calls: number = 1
): Promise<void> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return

  const { error } = await supabase.rpc('increment_api_budget_user', {
    p_date: todayUTC(),
    p_user_id: userId,
    p_provider: provider,
    p_increment: calls,
    p_limit: USER_DAILY_LIMITS[provider],
  })

  if (error) {
    const { logError } = await import('@/lib/errors/log-error')
    await logError({
      route: 'api-budget.incrementUser',
      error,
      userId,
      context: { provider, calls },
    })
  }
}

export class BudgetExceededError extends Error {
  public readonly provider: Provider

  constructor(provider: Provider) {
    super(
      `Budget global quotidien depasse pour ${provider} (${DAILY_LIMITS[provider]} appels/jour). Reprend demain a 00:00 UTC.`
    )
    this.name = 'BudgetExceededError'
    this.provider = provider
  }
}

export class UserBudgetExceededError extends Error {
  public readonly provider: Provider
  public readonly userId: string

  constructor(provider: Provider, userId: string) {
    super(
      `Budget user quotidien depasse pour ${provider} (${USER_DAILY_LIMITS[provider]} appels/jour). Reprend demain a 00:00 UTC.`
    )
    this.name = 'UserBudgetExceededError'
    this.provider = provider
    this.userId = userId
  }
}
