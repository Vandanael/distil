import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  authRateLimiter,
  expensiveRateLimiter,
  rateLimitHeaders,
  userActionRateLimiter,
} from '@/lib/rate-limit-upstash'

/**
 * Helper inline pour appliquer le rate limiting dans un handler de route API.
 *
 * Pourquoi pas en middleware/proxy.ts ? Le proxy Next.js 16 tourne en Edge runtime
 * (Deno) sur Netlify, ou process.env n'est pas fiable pour les vars dashboard
 * (incident 2026-04-12). Les routes API tournent en Node runtime, full access.
 *
 * Tier :
 * - 'auth'       : IP, 5 req/min. Routes de login/callback/unsubscribe.
 * - 'expensive'  : user, 10 req/min. Scoring, refresh, save (couts LLM/embeddings).
 * - 'userAction' : user, 60 req/min. Actions legeres (signal, feedback, etc.).
 *
 * Usage :
 *   const blocked = await enforceRateLimit('expensive', request)
 *   if (blocked) return blocked
 */

type Tier = 'auth' | 'expensive' | 'userAction'

function getClientIp(request: NextRequest | Request): string {
  const xff = request.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0]!.trim()
  const real = request.headers.get('x-real-ip')
  if (real) return real
  return '0.0.0.0'
}

export async function enforceRateLimit(
  tier: Tier,
  request: NextRequest | Request
): Promise<NextResponse | null> {
  let limiter
  let key: string

  if (tier === 'auth') {
    limiter = authRateLimiter()
    key = getClientIp(request)
  } else {
    // Pour expensive/userAction, tente userId via Supabase ; fallback IP.
    let userId: string | null = null
    try {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      userId = user?.id ?? null
    } catch {
      // Supabase non configure ou cookies absents : on tombera sur IP.
    }
    key = userId ?? `ip:${getClientIp(request)}`
    limiter = tier === 'expensive' ? expensiveRateLimiter() : userActionRateLimiter()
  }

  const res = await limiter.check(key)
  if (res.success) return null

  return new NextResponse(
    JSON.stringify({ error: 'Trop de requetes. Reessayez dans quelques instants.' }),
    {
      status: 429,
      headers: { 'content-type': 'application/json', ...rateLimitHeaders(res) },
    }
  )
}
