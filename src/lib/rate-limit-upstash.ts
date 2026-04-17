import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

/**
 * Rate limiter Upstash : protege les routes /api/* contre abuse.
 * Trois niveaux :
 * - auth : 5 req/min per IP (brute login, OAuth callback spam)
 * - expensive : 10 req/min per user (scoring, refresh, save : couts LLM/embeddings)
 * - userAction : 60 req/min per user (actions legeres : signal, feedback, subscribe)
 *
 * Si UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN manquent, les limiters renvoient
 * success=true (no-op) : pas de blocage en dev local. En prod Netlify, ces env sont
 * obligatoires et la protection est active.
 */

type LimitResult = {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return new Redis({ url, token })
}

function makeLimiter(
  prefix: string,
  limit: number,
  window: `${number} ${'s' | 'm' | 'h'}`
): {
  check: (key: string) => Promise<LimitResult>
} {
  const redis = getRedis()
  if (!redis) {
    return {
      check: async () => ({ success: true, limit, remaining: limit, reset: 0 }),
    }
  }

  const rl = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, window),
    analytics: false,
    prefix,
  })

  return {
    check: async (key: string) => {
      const res = await rl.limit(key)
      return {
        success: res.success,
        limit: res.limit,
        remaining: res.remaining,
        reset: res.reset,
      }
    },
  }
}

// Lazy : ne construit les limiters qu'a la premiere utilisation.
let _auth: ReturnType<typeof makeLimiter> | null = null
let _expensive: ReturnType<typeof makeLimiter> | null = null
let _userAction: ReturnType<typeof makeLimiter> | null = null

export function authRateLimiter() {
  if (!_auth) _auth = makeLimiter('rl:auth', 5, '1 m')
  return _auth
}

export function expensiveRateLimiter() {
  if (!_expensive) _expensive = makeLimiter('rl:expensive', 10, '1 m')
  return _expensive
}

export function userActionRateLimiter() {
  if (!_userAction) _userAction = makeLimiter('rl:user', 60, '1 m')
  return _userAction
}

/**
 * Retourne les headers a ajouter a une reponse 429 selon le resultat du limiter.
 */
export function rateLimitHeaders(res: LimitResult): HeadersInit {
  const retryAfter = Math.max(1, Math.ceil((res.reset - Date.now()) / 1000))
  return {
    'Retry-After': String(retryAfter),
    'X-RateLimit-Limit': String(res.limit),
    'X-RateLimit-Remaining': String(res.remaining),
    'X-RateLimit-Reset': String(res.reset),
  }
}

// Reset cache entre tests (utilise uniquement par les tests).
export function __resetLimitersForTests() {
  _auth = null
  _expensive = null
  _userAction = null
}
