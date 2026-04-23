/**
 * GET /api/digest/unsubscribe?token=...
 * Desactive le digest email en un clic depuis le lien email.
 * Token = user_id encode en base64url + signature HMAC.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyUnsubscribeToken } from '@/lib/email/token'
import { enforceRateLimit } from '@/lib/api-rate-limit'

export async function GET(req: NextRequest) {
  const blocked = await enforceRateLimit('auth', req)
  if (blocked) return blocked

  const token = req.nextUrl.searchParams.get('token')
  if (!token) {
    return new NextResponse(page('Lien invalide', 'Token manquant.'), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  const userId = verifyUnsubscribeToken(token)
  if (!userId) {
    return new NextResponse(page('Lien invalide', 'Token invalide.'), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return new NextResponse(page('Erreur', 'Service indisponible.'), {
      status: 503,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const { error } = await supabase.from('profiles').update({ digest_email: false }).eq('id', userId)

  if (error) {
    return new NextResponse(page('Erreur', 'Impossible de mettre à jour vos préférences.'), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  return new NextResponse(
    page(
      'Désabonné',
      'Vous ne recevrez plus le digest Distil. Vous pouvez le réactiver dans vos préférences.'
    ),
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  )
}

function page(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} - Distil</title></head>
<body style="margin:0;padding:40px 20px;background:#f7f8f3;font-family:-apple-system,system-ui,sans-serif;color:#1a3a2e;">
  <div style="max-width:400px;margin:0 auto;text-align:center;">
    <p style="font-size:20px;font-weight:700;color:#7A2E3A;">Distil</p>
    <h1 style="font-size:24px;margin:24px 0 8px;">${title}</h1>
    <p style="font-size:14px;color:#587060;">${message}</p>
  </div>
</body>
</html>`
}
