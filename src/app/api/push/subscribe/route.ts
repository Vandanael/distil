/**
 * POST /api/push/subscribe  — enregistre une souscription push
 * DELETE /api/push/subscribe — supprime la souscription
 * La souscription est stockee dans profiles.profile_structured.pushSubscription
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) return null

  const cookieStore = await cookies()
  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        for (const { name, value, options } of toSet) cookieStore.set(name, value, options)
      },
    },
  })
}

export async function POST(req: NextRequest) {
  const supabase = await getSupabase()
  if (!supabase) return NextResponse.json({ error: 'Supabase non configure' }, { status: 503 })

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })

  const subscription: PushSubscriptionJSON = await req.json()

  const { data: current } = await supabase
    .from('profiles')
    .select('profile_structured')
    .eq('id', user.id)
    .single()

  const merged = { ...(current?.profile_structured ?? {}), pushSubscription: subscription }

  await supabase.from('profiles').update({ profile_structured: merged }).eq('id', user.id)

  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const supabase = await getSupabase()
  if (!supabase) return NextResponse.json({ error: 'Supabase non configure' }, { status: 503 })

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })

  const { data: current } = await supabase
    .from('profiles')
    .select('profile_structured')
    .eq('id', user.id)
    .single()

  const structured = { ...(current?.profile_structured ?? {}) }
  delete structured.pushSubscription

  await supabase.from('profiles').update({ profile_structured: structured }).eq('id', user.id)

  return NextResponse.json({ ok: true })
}
