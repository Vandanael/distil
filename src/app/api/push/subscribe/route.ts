/**
 * POST /api/push/subscribe  - enregistre une souscription push
 * DELETE /api/push/subscribe - supprime la souscription
 * La souscription est stockee dans profiles.profile_structured.pushSubscription
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { enforceRateLimit } from '@/lib/api-rate-limit'

async function getSupabase() {
  try {
    return await createClient()
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const blocked = await enforceRateLimit('userAction', req)
  if (blocked) return blocked

  const supabase = await getSupabase()
  if (!supabase) return NextResponse.json({ error: 'Supabase non configure' }, { status: 503 })

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })

  const body: unknown = await req.json()
  if (
    !body ||
    typeof body !== 'object' ||
    !('endpoint' in body) ||
    typeof (body as Record<string, unknown>).endpoint !== 'string' ||
    !(body as Record<string, unknown>).endpoint ||
    !((body as Record<string, unknown>).endpoint as string).startsWith('https://') ||
    !('keys' in body) ||
    !body.keys ||
    typeof body.keys !== 'object' ||
    !('p256dh' in body.keys) ||
    !('auth' in body.keys)
  ) {
    return NextResponse.json({ error: 'Subscription invalide' }, { status: 400 })
  }
  const subscription = body as PushSubscriptionJSON

  const { data: current, error: fetchError } = await supabase
    .from('profiles')
    .select('profile_structured')
    .eq('id', user.id)
    .single()

  if (fetchError) {
    return NextResponse.json({ error: 'Profil introuvable' }, { status: 500 })
  }

  const merged = { ...(current?.profile_structured ?? {}), pushSubscription: subscription }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ profile_structured: merged })
    .eq('id', user.id)

  if (updateError) {
    return NextResponse.json({ error: 'Échec mise à jour profil' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const supabase = await getSupabase()
  if (!supabase) return NextResponse.json({ error: 'Supabase non configure' }, { status: 503 })

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })

  const { data: current, error: fetchError } = await supabase
    .from('profiles')
    .select('profile_structured')
    .eq('id', user.id)
    .single()

  if (fetchError) {
    return NextResponse.json({ error: 'Profil introuvable' }, { status: 500 })
  }

  const structured = { ...(current?.profile_structured ?? {}) }
  delete structured.pushSubscription

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ profile_structured: structured })
    .eq('id', user.id)

  if (updateError) {
    return NextResponse.json({ error: 'Échec mise à jour profil' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
