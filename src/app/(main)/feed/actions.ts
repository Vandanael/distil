'use server'

import { createClient } from '@/lib/supabase/server'

// Marque le message soft limit comme vu pour l'édition du jour.
// Empêche la réapparition même après refresh (flag persisté côté profiles).
export async function markSoftLimitShown(): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  const today = new Date().toISOString().slice(0, 10)
  await supabase.from('profiles').update({ last_soft_limit_shown_date: today }).eq('id', user.id)
}
