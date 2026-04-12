import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppHeader } from '@/components/AppHeader'
import { BottomNav } from '@/components/BottomNav'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  // Bypass auth en dev local uniquement
  if (process.env.NODE_ENV === 'development' && process.env.DEV_BYPASS_AUTH === 'true') {
    return <AppShell>{children}</AppShell>
  }

  // Sans credentials Supabase (dev sans .env.local), on laisse passer
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return <AppShell>{children}</AppShell>
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', user.id)
    .single()

  if (!profile?.onboarding_completed) {
    redirect('/onboarding')
  }

  return <AppShell>{children}</AppShell>
}

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full flex flex-col">
      {/* Header : masque sur /article/* mobile (lecture immersive) */}
      <AppHeader />

      {/* Contenu principal avec padding-bottom pour la BottomNav mobile */}
      <main id="main-content" className="flex-1 pb-14 md:pb-0">{children}</main>

      {/* Navigation mobile bas d'ecran */}
      <BottomNav />
    </div>
  )
}
