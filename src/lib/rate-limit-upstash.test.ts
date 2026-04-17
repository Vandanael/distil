import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Upstash : on capture les appels limit() et on controle success/limit/remaining/reset.
const limitCalls: Array<{ prefix: string; key: string }> = []
let mockSuccess = true
let mockRemaining = 4
let mockLimit = 5

vi.mock('@upstash/redis', () => ({
  Redis: class {
    constructor() {}
  },
}))

vi.mock('@upstash/ratelimit', () => {
  class Ratelimit {
    private prefix: string
    constructor(opts: { prefix: string }) {
      this.prefix = opts.prefix
    }
    async limit(key: string) {
      limitCalls.push({ prefix: this.prefix, key })
      return {
        success: mockSuccess,
        limit: mockLimit,
        remaining: mockRemaining,
        reset: Date.now() + 60_000,
      }
    }
    static slidingWindow() {
      return {}
    }
  }
  return { Ratelimit }
})

beforeEach(() => {
  limitCalls.length = 0
  mockSuccess = true
  mockRemaining = 4
  mockLimit = 5
  vi.resetModules()
})

describe('rate-limit-upstash', () => {
  it('renvoie success=true en no-op si env Upstash absent', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '')
    const { authRateLimiter, __resetLimitersForTests } = await import('./rate-limit-upstash')
    __resetLimitersForTests()

    const res = await authRateLimiter().check('1.2.3.4')
    expect(res.success).toBe(true)
    expect(limitCalls).toHaveLength(0)
  })

  it('appelle Ratelimit.limit avec la bonne cle quand configure', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://test.upstash.io')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'token')
    const { authRateLimiter, __resetLimitersForTests } = await import('./rate-limit-upstash')
    __resetLimitersForTests()

    await authRateLimiter().check('1.2.3.4')
    expect(limitCalls).toHaveLength(1)
    expect(limitCalls[0].prefix).toBe('rl:auth')
    expect(limitCalls[0].key).toBe('1.2.3.4')
  })

  it('propage success=false quand la limite est atteinte', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://test.upstash.io')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'token')
    mockSuccess = false
    mockRemaining = 0
    const { expensiveRateLimiter, __resetLimitersForTests } = await import('./rate-limit-upstash')
    __resetLimitersForTests()

    const res = await expensiveRateLimiter().check('user-id')
    expect(res.success).toBe(false)
    expect(res.remaining).toBe(0)
  })

  it('rateLimitHeaders formate correctement un 429', async () => {
    const { rateLimitHeaders } = await import('./rate-limit-upstash')
    const future = Date.now() + 42_000
    const headers = rateLimitHeaders({
      success: false,
      limit: 10,
      remaining: 0,
      reset: future,
    }) as Record<string, string>

    expect(Number(headers['Retry-After'])).toBeGreaterThanOrEqual(41)
    expect(Number(headers['Retry-After'])).toBeLessThanOrEqual(43)
    expect(headers['X-RateLimit-Limit']).toBe('10')
    expect(headers['X-RateLimit-Remaining']).toBe('0')
  })

  it('les trois limiters utilisent des prefixes distincts', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://test.upstash.io')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'token')
    const {
      authRateLimiter,
      expensiveRateLimiter,
      userActionRateLimiter,
      __resetLimitersForTests,
    } = await import('./rate-limit-upstash')
    __resetLimitersForTests()

    await authRateLimiter().check('k')
    await expensiveRateLimiter().check('k')
    await userActionRateLimiter().check('k')

    const prefixes = limitCalls.map((c) => c.prefix)
    expect(prefixes).toEqual(['rl:auth', 'rl:expensive', 'rl:user'])
  })
})
