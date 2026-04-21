/**
 * POST /api/cron/digest
 * Envoie le digest email aux utilisateurs opt-in.
 * Protege par CRON_SECRET. Prevu pour tourner a 7h00 UTC.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email/send'
import { buildDigestHtml, buildDigestText } from '@/lib/email/digest-template'
import { signUnsubscribeToken } from '@/lib/email/token'
import { verifyCronSecret } from '@/lib/auth/cron'

export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://distil.app'

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Supabase non configure' }, { status: 503 })
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'Resend non configure' }, { status: 503 })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Charger les utilisateurs avec digest_email active
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id')
    .eq('onboarding_completed', true)
    .eq('digest_email', true)

  if (profilesError || !profiles) {
    return NextResponse.json({ error: 'Impossible de charger les profils' }, { status: 500 })
  }

  const date = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const results: Array<{ userId: string; sent: boolean; error: string | null }> = []

  for (const profile of profiles) {
    try {
      // Recuperer l'email de l'utilisateur
      const { data: authUser } = await supabase.auth.admin.getUserById(profile.id)
      const email = authUser?.user?.email
      if (!email) {
        results.push({ userId: profile.id, sent: false, error: 'Email non trouve' })
        continue
      }

      // 5 meilleurs articles acceptes, non lus, non archives, jamais envoyes dans un digest
      const { data: articles } = await supabase
        .from('articles')
        .select('id, title, site_name, excerpt, score, reading_time_minutes')
        .eq('user_id', profile.id)
        .eq('status', 'pending')
        .is('read_at', null)
        .is('archived_at', null)
        .is('digest_sent_at', null)
        .order('score', { ascending: false, nullsFirst: false })
        .limit(5)

      if (!articles || articles.length === 0) {
        results.push({ userId: profile.id, sent: false, error: 'Aucun article non lu' })
        continue
      }

      // Token de desabonnement = user id encode en base64 (suffisant pour MVP solo)
      const unsubToken = signUnsubscribeToken(profile.id)
      const unsubscribeUrl = `${appUrl}/api/digest/unsubscribe?token=${unsubToken}`

      const html = buildDigestHtml({ articles, appUrl, unsubscribeUrl, date })
      const text = buildDigestText({ articles, appUrl, unsubscribeUrl, date })

      await sendEmail({
        to: email,
        subject: `Distil - ${date}`,
        html,
        text,
      })

      // Marquer les articles envoyes pour ne pas les re-envoyer demain
      await supabase
        .from('articles')
        .update({ digest_sent_at: new Date().toISOString() })
        .in(
          'id',
          articles.map((a) => a.id)
        )

      results.push({ userId: profile.id, sent: true, error: null })
    } catch (err) {
      results.push({
        userId: profile.id,
        sent: false,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  return NextResponse.json({
    profilesWithDigest: profiles.length,
    sent: results.filter((r) => r.sent).length,
    errors: results.filter((r) => !r.sent).length,
    results,
  })
}
