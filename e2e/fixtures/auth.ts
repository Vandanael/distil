/**
 * Fixture d'authentification pour les tests E2E.
 *
 * En dev, Supabase inbucket intercepte les magic links.
 * Cette fixture simule un utilisateur connecte en injectant
 * une session via l'API Supabase locale.
 *
 * Usage : appeler `loginAs(page, email)` avant les assertions metier.
 */
import { type Page } from '@playwright/test'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost:54321'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

export async function loginAs(page: Page, email: string) {
  // Creer un magic link via l'API admin Supabase
  const res = await page.request.post(
    `${SUPABASE_URL}/auth/v1/admin/users`,
    {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      data: {
        email,
        email_confirm: true,
      },
    }
  )

  if (!res.ok()) {
    // L'utilisateur existe peut-etre deja, on continue
  }

  // Generer un lien de connexion
  const linkRes = await page.request.post(
    `${SUPABASE_URL}/auth/v1/admin/generate_link`,
    {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      data: {
        type: 'magiclink',
        email,
        options: {
          redirect_to: 'http://localhost:3000/auth/callback',
        },
      },
    }
  )

  const { action_link } = await linkRes.json() as { action_link: string }
  await page.goto(action_link)
  // Le callback redirige vers /onboarding ou /feed
  await page.waitForURL(/\/(onboarding|feed|profile)/)
}
