import type { Config } from '@netlify/functions'

const handler = async (): Promise<void> => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const cronSecret = process.env.CRON_SECRET

  if (!appUrl || !cronSecret) {
    console.error('[embed-items] Variables NEXT_PUBLIC_APP_URL ou CRON_SECRET manquantes')
    return
  }

  const response = await fetch(`${appUrl}/api/cron/embed`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cronSecret}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const text = await response.text()
    console.error(`[embed-items] Echec : ${response.status} - ${text}`)
    return
  }

  const result = await response.json()
  console.log(`[embed-items] OK : ${JSON.stringify(result)}`)
}

export default handler

export const config: Config = {
  schedule: '15 * * * *',
}
