/**
 * GET /api/feed/status
 * Retourne le nombre d'articles acceptes pour l'utilisateur connecte.
 * Utilise par la welcome page pour savoir quand le feed est pret.
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { enforceRateLimit } from '@/lib/api-rate-limit'

export async function GET(request: Request) {
  const blocked = await enforceRateLimit('userAction', request)
  if (blocked) return blocked

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ count: 0 }, { status: 401 })
  }

  const { count } = await supabase
    .from('articles')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'accepted')

  return NextResponse.json({ count: count ?? 0 }, { headers: { 'Cache-Control': 'no-store' } })
}
