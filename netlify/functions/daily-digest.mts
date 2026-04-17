/**
 * Netlify Scheduled Function - Envoie le digest email quotidien aux utilisateurs opt-in.
 * Planifie : tous les jours a 7h30 UTC (apres daily-refresh a 6h30 et daily-rank a 7h00).
 * Docs : https://docs.netlify.com/functions/scheduled-functions/
 */
import type { Config } from '@netlify/functions'

const handler = async (): Promise<void> => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const cronSecret = process.env.CRON_SECRET

  if (!appUrl || !cronSecret) {
    console.error('[daily-digest] Variables NEXT_PUBLIC_APP_URL ou CRON_SECRET manquantes')
    return
  }

  const response = await fetch(`${appUrl}/api/cron/digest`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cronSecret}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const text = await response.text()
    console.error(`[daily-digest] Echec : ${response.status} - ${text}`)
    return
  }

  const result = await response.json()
  console.log(`[daily-digest] OK : ${JSON.stringify(result)}`)
}

export default handler

export const config: Config = {
  schedule: '30 7 * * *',
}
