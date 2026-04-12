import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Route diagnostic : renvoie les env vars presentes (sans valeurs)
  if (request.nextUrl.pathname === '/api/dev/env-check') {
    const vars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
    ]
    const result = vars.map((v) => ({
      name: v,
      set: typeof process.env[v] === 'string' && process.env[v]!.length > 0,
    }))
    return NextResponse.json({ runtime: 'edge-middleware', vars: result })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/dev/env-check'],
}
