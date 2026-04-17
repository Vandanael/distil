import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyCronSecret } from '@/lib/auth/cron'
import { logError } from '@/lib/errors/log-error'

/**
 * Alerte budget API : scrute les consommations global + per-user pour aujourd'hui
 * et poste sur BUDGET_ALERT_WEBHOOK_URL (Discord/Slack) si seuils depasses :
 * - Global > 80% du cap.
 * - Au moins un user > 90% du cap per-user.
 *
 * Idempotent : peut tourner toutes les heures sans doublon (le webhook reste bruyant
 * si seuil maintenu, c'est voulu : alert fatigue < facture surprise).
 */

const GLOBAL_THRESHOLD = 0.8
const USER_THRESHOLD = 0.9
// Supabase free tier = 500MB. Alerte a 400MB pour laisser le temps d'upgrade Pro.
const DB_SIZE_WARN_MB = intEnv('SUPABASE_DB_SIZE_WARN_MB', 400)

type Provider = 'voyage' | 'gemini'

function intEnv(name: string, fallback: number): number {
  const raw = process.env[name]
  if (!raw) return fallback
  const n = parseInt(raw, 10)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

const GLOBAL_LIMITS: Record<Provider, number> = {
  voyage: intEnv('API_BUDGET_GLOBAL_VOYAGE', 3000),
  gemini: intEnv('API_BUDGET_GLOBAL_GEMINI', 500),
}

const USER_LIMITS: Record<Provider, number> = {
  voyage: intEnv('API_BUDGET_USER_VOYAGE', 100),
  gemini: intEnv('API_BUDGET_USER_GEMINI', 30),
}

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10)
}

export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    return NextResponse.json({ error: 'Supabase non configure' }, { status: 500 })
  }
  const supabase = createClient(url, key)
  const date = todayUTC()

  const alerts: string[] = []

  try {
    const { data: globals } = await supabase
      .from('api_budget_log')
      .select('provider, calls_used')
      .eq('date', date)

    for (const row of globals ?? []) {
      const provider = row.provider as Provider
      const limit = GLOBAL_LIMITS[provider]
      if (!limit) continue
      const ratio = row.calls_used / limit
      if (ratio >= GLOBAL_THRESHOLD) {
        alerts.push(
          `**Global ${provider}** : ${row.calls_used}/${limit} (${Math.round(ratio * 100)}%)`
        )
      }
    }

    const { data: users } = await supabase
      .from('api_budget_log_user')
      .select('user_id, provider, calls_used')
      .eq('date', date)

    const hotUsers: Array<{ user_id: string; provider: Provider; ratio: number; used: number }> = []
    for (const row of users ?? []) {
      const provider = row.provider as Provider
      const limit = USER_LIMITS[provider]
      if (!limit) continue
      const ratio = row.calls_used / limit
      if (ratio >= USER_THRESHOLD) {
        hotUsers.push({ user_id: row.user_id, provider, ratio, used: row.calls_used })
      }
    }

    if (hotUsers.length > 0) {
      const lines = hotUsers
        .slice(0, 10)
        .map(
          (u) =>
            `- user \`${u.user_id.slice(0, 8)}\` ${u.provider} : ${u.used}/${USER_LIMITS[u.provider]} (${Math.round(u.ratio * 100)}%)`
        )
      alerts.push(
        `**Users > ${Math.round(USER_THRESHOLD * 100)}%** (${hotUsers.length}) :\n${lines.join('\n')}`
      )
    }

    const { data: sizeBytes } = await supabase.rpc('db_size_bytes')
    if (typeof sizeBytes === 'number') {
      const sizeMb = Math.round(sizeBytes / 1_000_000)
      if (sizeMb >= DB_SIZE_WARN_MB) {
        alerts.push(
          `**DB size** : ${sizeMb}MB (seuil ${DB_SIZE_WARN_MB}MB). Penser a upgrade Supabase Pro.`
        )
      }
    }

    if (alerts.length === 0) {
      return NextResponse.json({ date, alerts: 0 })
    }

    const webhook = process.env.BUDGET_ALERT_WEBHOOK_URL
    if (webhook) {
      const body = {
        content: `Alerte budget Distil (${date})\n\n${alerts.join('\n\n')}`,
      }
      const res = await fetch(webhook, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        await logError({
          route: 'cron.budget-alert',
          error: new Error(`Webhook failed: ${res.status}`),
          context: { status: res.status },
        })
      }
    }

    return NextResponse.json({ date, alerts: alerts.length, notified: Boolean(webhook) })
  } catch (error) {
    await logError({ route: 'cron.budget-alert', error })
    return NextResponse.json({ error: 'Echec interne' }, { status: 500 })
  }
}
