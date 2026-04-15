import type { Config } from '@netlify/functions'

const handler = async (): Promise<void> => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const cronSecret = process.env.CRON_SECRET

  if (!appUrl || !cronSecret) {
    console.error('[daily-rank] Variables NEXT_PUBLIC_APP_URL ou CRON_SECRET manquantes')
    return
  }

  const response = await fetch(`${appUrl}/api/cron/rank`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cronSecret}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const text = await response.text()
    console.error(`[daily-rank] Echec : ${response.status} - ${text}`)
    return
  }

  const result = await response.json()
  console.log(`[daily-rank] OK : ${JSON.stringify(result)}`)
}

export default handler

export const config: Config = {
  schedule: '0 7 * * *',
}
