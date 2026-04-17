'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const BETA_COOKIE = 'beta_access'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 jours

function expectedCode(): string {
  return process.env.BETA_ACCESS_CODE ?? '1919'
}

export async function grantBetaAccess(formData: FormData): Promise<{ error: string } | void> {
  const code = String(formData.get('code') ?? '').trim()

  if (code !== expectedCode()) {
    return { error: 'Code invalide.' }
  }

  const cookieStore = await cookies()
  cookieStore.set(BETA_COOKIE, '1', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  })

  redirect('/')
}
