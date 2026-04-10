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
  const { data: { user } } = await supabase.auth.getUser()

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
    <main className="flex flex-1 flex-col items-center p-8 bg-background">
      <div className="w-full max-w-xl space-y-8">
        <div className="space-y-1">
          <h1 className="font-[family-name:var(--font-fraunces)] text-3xl font-semibold text-foreground">
            Preferences
          </h1>
          <p className="font-[family-name:var(--font-source-serif)] text-muted-foreground text-sm">
            {user.email}
          </p>
        </div>
        <ProfileForm profile={profile} />
      </div>
    </main>
  )
}
