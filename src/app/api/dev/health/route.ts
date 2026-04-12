import { NextResponse } from 'next/server'

// Force Node.js runtime (pas Edge) pour avoir acces aux env vars
export const runtime = 'nodejs'

const REQUIRED_VARS = [
  // Supabase
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  // IA
  'ANTHROPIC_API_KEY',
  'VOYAGE_API_KEY',
  // App
  'NEXT_PUBLIC_APP_URL',
  // Cron
  'CRON_SECRET',
  // Push notifications
  'VAPID_PUBLIC_KEY',
  'NEXT_PUBLIC_VAPID_PUBLIC_KEY',
  'VAPID_PRIVATE_KEY',
  'VAPID_EMAIL',
] as const

export async function GET() {

  const results = REQUIRED_VARS.map((name) => {
    const value = process.env[name]
    const set = typeof value === 'string' && value.length > 0
    return {
      name,
      set,
      // Montre juste le prefixe pour debug, jamais la valeur complete
      preview: set ? `${value!.slice(0, 8)}...` : null,
    }
  })

  const missing = results.filter((r) => !r.set)

  return NextResponse.json({
    ok: missing.length === 0,
    total: REQUIRED_VARS.length,
    missing: missing.length,
    vars: results,
  })
}
