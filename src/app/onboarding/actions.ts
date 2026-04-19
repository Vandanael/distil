'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export type ProfileInput = {
  method: 'express' | 'wizard'
  profile_text?: string
  interests?: string[]
  pinned_sources?: string[]
  daily_cap?: number
  serendipity_quota?: number
  language?: 'fr' | 'en' | 'both'
}

export async function createProfile(input: ProfileInput) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Non authentifie')
  }

  const profileStructured = input.language ? { language: input.language } : null

  const { error } = await supabase.from('profiles').upsert({
    id: user.id,
    profile_text: input.profile_text ?? null,
    interests: input.interests ?? [],
    pinned_sources: input.pinned_sources ?? [],
    daily_cap: input.daily_cap ?? 10,
    serendipity_quota: input.serendipity_quota ?? 0.15,
    onboarding_completed: true,
    onboarding_method: input.method,
    profile_structured: profileStructured,
  })

  if (error) {
    throw new Error(error.message)
  }

  redirect('/onboarding/welcome')
}
