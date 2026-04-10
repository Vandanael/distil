import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileForm } from './ProfileForm'

export default async function ProfilePage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center p-8 bg-background">
        <p className="font-[family-name:var(--font-geist)] text-sm text-muted-foreground">
          Configurez .env.local pour activer le profil.
        </p>
      </main>
    )
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
    .select(
      'profile_text, sector, interests, pinned_sources, daily_cap, serendipity_quota, show_scores'
    )
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/onboarding')
  }

  return (
    <main className="flex min-h-full flex-col p-8 md:p-16 bg-background">
      <div className="w-full max-w-xl space-y-10">
        <div className="space-y-4 border-b border-border pb-8">
          <p className="font-ui text-[10px] uppercase tracking-widest text-accent">Profil</p>
          <h1 className="font-heading text-4xl font-semibold text-foreground">Preferences</h1>
          <p className="font-body text-sm text-muted-foreground">{user.email}</p>
        </div>
        <ProfileForm profile={profile} />
      </div>
    </main>
  )
}
