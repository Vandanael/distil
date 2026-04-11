'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type ProfileUpdate = {
  profile_text?: string
  sector?: string
  interests?: string[]
  pinned_sources?: string[]
  daily_cap?: number
  serendipity_quota?: number
  show_scores?: boolean
  language?: 'fr' | 'en' | 'both'
}

export async function updateProfile(input: ProfileUpdate) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Non authentifie')
  }

  const { language, ...rest } = input

  // Merge language dans profile_structured sans ecraser les autres champs
  if (language !== undefined) {
    const { data: current } = await supabase
      .from('profiles')
      .select('profile_structured')
      .eq('id', user.id)
      .single()

    const merged = { ...(current?.profile_structured ?? {}), language }
    const { error } = await supabase
      .from('profiles')
      .update({ ...rest, profile_structured: merged })
      .eq('id', user.id)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase.from('profiles').update(rest).eq('id', user.id)
    if (error) throw new Error(error.message)
  }

  revalidatePath('/profile')
}
