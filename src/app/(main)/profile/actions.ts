'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

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

export async function toggleDigestEmail(enabled: boolean) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifie')

  const { error } = await supabase
    .from('profiles')
    .update({ digest_email: enabled })
    .eq('id', user.id)
  if (error) throw new Error(error.message)

  revalidatePath('/profile')
}

export async function updatePinnedSources(
  urls: string[]
): Promise<{ added: number; total: number }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifie')

  const { data: current } = await supabase
    .from('profiles')
    .select('pinned_sources')
    .eq('id', user.id)
    .single()

  const existing: string[] = current?.pinned_sources ?? []
  const merged = Array.from(new Set([...existing, ...urls])).slice(0, 50)

  const { error } = await supabase
    .from('profiles')
    .update({ pinned_sources: merged })
    .eq('id', user.id)
  if (error) throw new Error(error.message)

  revalidatePath('/profile')
  return { added: merged.length - existing.length, total: merged.length }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
