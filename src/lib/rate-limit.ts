import type { SupabaseClient } from '@supabase/supabase-js'

const REFRESH_WINDOW_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Verifie si l'utilisateur a lance un refresh recemment.
 * Utilise la table scoring_runs comme source de verite - pas de migration necessaire.
 * Retourne null si ok, ou le nombre de secondes a attendre sinon.
 */
export async function checkRefreshRateLimit(
  supabase: SupabaseClient,
  userId: string
): Promise<number | null> {
  const since = new Date(Date.now() - REFRESH_WINDOW_MS).toISOString()

  const { data } = await supabase
    .from('scoring_runs')
    .select('created_at')
    .eq('user_id', userId)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!data) return null

  const elapsed = Date.now() - new Date(data.created_at).getTime()
  return Math.ceil((REFRESH_WINDOW_MS - elapsed) / 1000)
}
