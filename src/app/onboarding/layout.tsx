import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ThemeToggle } from '@/components/ThemeToggle'

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  // Sans credentials Supabase (dev sans .env.local), on laisse passer
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return (
      <>
        <div className="fixed top-3 right-3"><ThemeToggle /></div>
        {children}
      </>
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Si l'onboarding est deja complete, renvoyer vers le feed
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', user.id)
    .single()

  if (profile?.onboarding_completed) {
    redirect('/feed')
  }

  return (
    <>
      <div className="fixed top-3 right-3"><ThemeToggle /></div>
      {children}
    </>
  )
}
