import { createClient } from '@supabase/supabase-js'

/**
 * Logge une erreur server-side dans la table error_log + console.error fallback.
 * Utiliser dans les routes API et les agents pour concentrer les incidents a un endroit
 * requetable par user_id. Alternative legere a Sentry pour MVP.
 *
 * L'insertion est best-effort : si Supabase fail, on loggue sur console et on avance.
 * Jamais throw : le logging ne doit pas casser le flow de l'appelant.
 */

type LogErrorInput = {
  route: string
  error: unknown
  userId?: string | null
  context?: Record<string, unknown>
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

function toMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  try {
    return JSON.stringify(error)
  } catch {
    return String(error)
  }
}

function toStack(error: unknown): string | null {
  return error instanceof Error && error.stack ? error.stack : null
}

export async function logError({
  route,
  error,
  userId = null,
  context,
}: LogErrorInput): Promise<void> {
  const message = toMessage(error)
  const stack = toStack(error)

  // Toujours logger en console : Netlify function logs restent le fallback.
  console.error(`[${route}]`, message, context ?? '')

  const supabase = getSupabaseAdmin()
  if (!supabase) return

  try {
    await supabase.from('error_log').insert({
      route,
      user_id: userId,
      message: message.slice(0, 2000),
      stack: stack?.slice(0, 4000) ?? null,
      context: context ?? null,
    })
  } catch {
    // Double echec : on a deja loggue en console, on abandonne silencieusement.
  }
}
