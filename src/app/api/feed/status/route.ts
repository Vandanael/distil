/**
 * GET /api/feed/status
 * Retourne le nombre d'articles acceptes pour l'utilisateur connecte.
 * Utilise par la welcome page pour savoir quand le feed est pret.
 */
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ count: 0 })
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        for (const { name, value, options } of toSet) {
          cookieStore.set(name, value, options)
        }
      },
    },
  })

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

  return NextResponse.json({ count: count ?? 0 })
}
