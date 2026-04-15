import { createClient } from '@supabase/supabase-js'

/**
 * API budget guard - prevents unexpected bills by tracking daily API call counts.
 * Each provider has a hard daily limit. If exceeded, calls are blocked until midnight UTC.
 *
 * Expected monthly costs at normal usage:
 * - Voyage: ~$0.10 (embeddings, 50 items/day max)
 * - Gemini: ~$0.15 (1 ranking/day + 1 profile/week)
 * - Anthropic: ~$0.00 (fallback only, rarely used)
 *
 * These limits are generous safety caps, not normal operating targets.
 */

type Provider = 'voyage' | 'gemini' | 'anthropic' | 'groq'

// Hard daily call limits per provider
const DAILY_LIMITS: Record<Provider, number> = {
  voyage: 100, // ~50 items/day normal, 100 = 2x safety margin
  gemini: 20, // 1 ranking + 1 profile normal, 20 = generous margin
  anthropic: 10, // fallback only, should rarely fire
  groq: 50, // free tier, 14k/day limit on their side
}

// In-memory counters (reset on process restart, hydrated from DB on first access)
const counters: Record<Provider, { date: string; count: number; hydrated: boolean }> = {
  voyage: { date: '', count: 0, hydrated: false },
  gemini: { date: '', count: 0, hydrated: false },
  anthropic: { date: '', count: 0, hydrated: false },
  groq: { date: '', count: 0, hydrated: false },
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

async function hydrateFromDb(provider: Provider): Promise<void> {
  const c = getCounter(provider)
  if (c.hydrated) return
  c.hydrated = true

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseServiceKey) return

  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const { data } = await supabase
    .from('api_budget_log')
    .select('calls_used')
    .eq('date', c.date)
    .eq('provider', provider)
    .single()

  if (data) {
    c.count = Math.max(c.count, data.calls_used)
  }
}

/**
 * Check if a provider call is allowed. Returns true if within budget.
 * Call this BEFORE making any paid API call.
 * Hydrates from DB on first access per day to survive serverless restarts.
 */
export async function canCallProvider(provider: Provider): Promise<boolean> {
  await hydrateFromDb(provider)
  const c = getCounter(provider)
  return c.count < DAILY_LIMITS[provider]
}

/**
 * Record a provider call. Call this AFTER a successful API call.
 */
export function recordProviderCall(provider: Provider, calls: number = 1): void {
  const c = getCounter(provider)
  c.count += calls
}

/**
 * Get remaining calls for a provider today.
 */
export function remainingCalls(provider: Provider): number {
  const c = getCounter(provider)
  return Math.max(0, DAILY_LIMITS[provider] - c.count)
}

/**
 * Get budget status for all providers (for monitoring/debugging).
 */
export function budgetStatus(): Record<
  Provider,
  { used: number; limit: number; remaining: number }
> {
  return Object.fromEntries(
    (Object.keys(DAILY_LIMITS) as Provider[]).map((p) => {
      const c = getCounter(p)
      return [p, { used: c.count, limit: DAILY_LIMITS[p], remaining: remainingCalls(p) }]
    })
  ) as Record<Provider, { used: number; limit: number; remaining: number }>
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

/**
 * Persist daily totals to DB for observability (optional, best-effort).
 */
export async function persistBudgetSnapshot(): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseServiceKey) return

  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const status = budgetStatus()
  const today = todayUTC()

  for (const [provider, data] of Object.entries(status)) {
    if (data.used === 0) continue
    await supabase.from('api_budget_log').upsert(
      {
        date: today,
        provider,
        calls_used: data.used,
        calls_limit: data.limit,
      },
      { onConflict: 'date,provider' }
    )
  }
}
