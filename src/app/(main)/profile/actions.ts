'use server'

import { createClient } from '@/lib/supabase/server'
import { generateProfileEmbedding } from '@/lib/embeddings/profile-embedding'
import { logError } from '@/lib/errors/log-error'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export type ProfileUpdate = {
  profile_text?: string
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

  // Si profile_text ou interests changent, il faut regenerer l'embedding :
  // sinon le ranking continue a tourner sur l'ancien vecteur et le feed derive.
  const needsEmbeddingRefresh = 'profile_text' in input || 'interests' in input
  let embeddingJson: string | null = null
  if (needsEmbeddingRefresh) {
    const { data: current } = await supabase
      .from('profiles')
      .select('profile_text, sector, interests')
      .eq('id', user.id)
      .single()
    try {
      const vector = await generateProfileEmbedding(
        {
          profile_text: input.profile_text ?? current?.profile_text ?? null,
          sector: current?.sector ?? null,
          interests: input.interests ?? current?.interests ?? [],
        },
        user.id
      )
      if (vector) embeddingJson = JSON.stringify(vector)
    } catch (err) {
      await logError({
        route: 'profile.updateProfile.embedding',
        error: err,
        userId: user.id,
      })
    }
  }

  const embeddingPatch = embeddingJson ? { embedding: embeddingJson } : {}

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
      .update({ ...rest, profile_structured: merged, ...embeddingPatch })
      .eq('id', user.id)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase
      .from('profiles')
      .update({ ...rest, ...embeddingPatch })
      .eq('id', user.id)
    if (error) throw new Error(error.message)
  }

  revalidatePath('/profile')
  revalidatePath('/feed')
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
