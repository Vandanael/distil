import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

// Gate partage par onboarding/page.tsx et onboarding/welcome/page.tsx.
// Non applique a onboarding/preview (page publique).
export async function ensureOnboardingAccess(): Promise<void> {
  // Dev sans .env.local : on laisse passer, le feed fera ses propres fallbacks.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', user.id)
    .single()

  if (profile?.onboarding_completed) redirect('/feed')
}
