import { createClient } from '@supabase/supabase-js'

/**
 * API budget guard - prevents unexpected bills by tracking daily API call counts.
 * Each provider has a hard daily limit. If exceeded, calls are blocked until midnight UTC.
 *
 * Expected monthly costs at normal usage:
 * - Voyage: ~$0.10 (embeddings, 50 items/day max)
 * - Gemini: ~$0.15 (scoring + ranking + profile-generator)
 *
 * These limits are generous safety caps, not normal operating targets.
 *
 * Persistance : compteur en memoire (fast path) + RPC increment_api_budget (source de verite).
 * Le RPC est atomique cote DB et resync le compteur memoire avec la realite partagee.
 */

type Provider = 'voyage' | 'gemini'

// Hard daily call limits per provider
const DAILY_LIMITS: Record<Provider, number> = {
  voyage: 100, // ~50 items/day normal, 100 = 2x safety margin
  gemini: 20, // 1 ranking + 1 profile normal, 20 = generous margin
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
 * Enregistre un appel provider (increment atomique DB + memoire).
 * Appeler APRES un appel reussi. Loggue et continue si la DB echoue :
 * le compteur memoire reste correct pour la suite du process en cours.
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
    console.error('[api-budget] increment_api_budget failed', error)
    return
  }

  // Resync : si un autre process a deja incremente, prendre la valeur DB.
  if (typeof data === 'number' && data > c.count) {
    c.count = data
  }
}

/**
 * Guard wrapper - throws if budget exceeded. Use as a pre-check.
 */
export async function assertBudget(provider: Provider): Promise<void> {
  if (!(await canCallProvider(provider))) {
    throw new BudgetExceededError(provider)
  }
}

export class BudgetExceededError extends Error {
  public readonly provider: Provider

  constructor(provider: Provider) {
    super(
      `Budget quotidien depasse pour ${provider} (${DAILY_LIMITS[provider]} appels/jour). Reprend demain a 00:00 UTC.`
    )
    this.name = 'BudgetExceededError'
    this.provider = provider
  }
}
