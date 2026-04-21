/**
 * Netlify Scheduled Background Function - Refresh quotidien du feed pour tous les utilisateurs.
 * Suffix `-background` : timeout 15 min (vs 30s pour une scheduled function synchrone).
 * Planifie : tous les jours a 6h30 UTC.
 *
 * Pattern : fan-out HTTP. On liste les user IDs via Supabase service role, puis on
 * declenche /api/cron/refresh-user en parallele (concurrence 3) pour isoler les
 * pipelines par user et rester sous le timeout proxy Next.
 *
 * Docs : https://docs.netlify.com/functions/scheduled-functions/
 */
import type { Config } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

const CONCURRENCY = 3

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let index = 0
  async function worker() {
    while (true) {
      const i = index++
      if (i >= items.length) return
      results[i] = await fn(items[i])
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker())
  await Promise.all(workers)
  return results
}

const handler = async (): Promise<void> => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const cronSecret = process.env.CRON_SECRET
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!appUrl || !cronSecret || !supabaseUrl || !supabaseServiceKey) {
    console.error('[daily-refresh] Variables d environnement manquantes')
    return
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('onboarding_completed', true)

  if (error || !profiles) {
    console.error(`[daily-refresh] Impossible de charger les profils : ${error?.message}`)
    return
  }

  if (profiles.length === 0) {
    console.log('[daily-refresh] Aucun utilisateur onboarde')
    return
  }

  console.log(`[daily-refresh] Start : ${profiles.length} users, concurrence ${CONCURRENCY}`)

  type UserResult = {
    userId: string
    ok: boolean
    status: number
    accepted?: number
    error?: string
  }

  const results = await mapWithConcurrency<{ id: string }, UserResult>(
    profiles,
    CONCURRENCY,
    async (profile) => {
      try {
        const response = await fetch(`${appUrl}/api/cron/refresh-user`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${cronSecret}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: profile.id }),
        })

        if (!response.ok) {
          const text = await response.text()
          return {
            userId: profile.id,
            ok: false,
            status: response.status,
            error: text.slice(0, 200),
          }
        }

        const data = (await response.json()) as { accepted?: number; error?: string | null }
        return {
          userId: profile.id,
          ok: true,
          status: response.status,
          accepted: data.accepted ?? 0,
          error: data.error ?? undefined,
        }
      } catch (err) {
        return {
          userId: profile.id,
          ok: false,
          status: 0,
          error: err instanceof Error ? err.message : String(err),
        }
      }
    }
  )

  const success = results.filter((r) => r.ok).length
  const failed = results.filter((r) => !r.ok)
  const totalAccepted = results.reduce((sum, r) => sum + (r.accepted ?? 0), 0)

  console.log(
    `[daily-refresh] Done : ${success}/${profiles.length} OK, ${totalAccepted} articles acceptes`
  )

  if (failed.length > 0) {
    for (const f of failed) {
      console.error(`[daily-refresh] Fail user=${f.userId} status=${f.status} error=${f.error}`)
    }
  }
}

export default handler

export const config: Config = {
  schedule: '30 6 * * *',
}
