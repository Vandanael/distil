/**
 * Envoie une push notification a un abonne.
 * Necessite les variables VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL.
 * Pour generer les cles : pnpm exec web-push generate-vapid-keys
 */
import webpush from 'web-push'

let vapidConfigured = false

function ensureVapid() {
  if (vapidConfigured) return true

  const publicKey = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const email = process.env.VAPID_EMAIL

  if (!publicKey || !privateKey || !email) return false

  webpush.setVapidDetails(`mailto:${email}`, publicKey, privateKey)
  vapidConfigured = true
  return true
}

export type PushPayload = {
  title: string
  body: string
  url?: string
}

export async function sendPushNotification(
  subscription: PushSubscriptionJSON,
  payload: PushPayload
): Promise<void> {
  if (!ensureVapid()) return // VAPID non configure, on ignore silencieusement

  try {
    await webpush.sendNotification(
      subscription as webpush.PushSubscription,
      JSON.stringify(payload)
    )
  } catch (err) {
    // Souscription expiree ou invalide — on ignore (sera nettoyee au prochain cycle)
    console.error('[push] sendNotification error:', err instanceof Error ? err.message : err)
  }
}
