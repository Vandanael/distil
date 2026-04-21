import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileForm } from './ProfileForm'
import { AdvancedSettings } from './AdvancedSettings'
import { TokensSection } from './TokensSection'
import { PushSubscribe } from '@/components/PushSubscribe'
import { ThemeToggle } from '@/components/ThemeToggle'
import { listApiTokens } from './token-actions'
import { signOut } from './actions'
import { DigestToggle } from './DigestToggle'

export default async function ProfilePage() {
  if (
    (process.env.NODE_ENV === 'development' && process.env.DEV_BYPASS_AUTH === 'true') ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 md:py-12 space-y-10 w-full">
        <div className="space-y-4 border-b border-border pb-8">
          <p className="font-ui text-sm text-accent">Profil</p>
          <h1 className="font-ui text-3xl font-bold leading-tight text-foreground">Preferences</h1>
        </div>
        <TokensSection tokens={[]} />
      </div>
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select(
      'profile_text, interests, pinned_sources, daily_cap, serendipity_quota, profile_structured, digest_email, discovery_mode'
    )
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/onboarding')

  const tokens = await listApiTokens()

  const structured = profile.profile_structured as Record<string, unknown> | null
  const language = structured?.language as 'fr' | 'en' | 'both' | undefined

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 md:py-12 space-y-10 w-full">
      <div className="space-y-4 border-b border-border pb-8">
        <p className="font-ui text-sm text-accent">Profil</p>
        <h1 className="font-ui text-3xl font-bold leading-tight text-foreground">Preferences</h1>
        <p className="font-body text-sm text-muted-foreground">{user.email}</p>
      </div>

      <ProfileForm
        profile={{
          profile_text: profile.profile_text,
          interests: profile.interests ?? [],
          pinned_sources: profile.pinned_sources ?? [],
          language,
          discovery_mode: profile.discovery_mode ?? 'active',
        }}
      />

      <div className="border-t border-border pt-8">
        <form action={signOut}>
          <button
            type="submit"
            className="font-ui text-sm text-muted-foreground hover:text-destructive hover:underline underline-offset-4 transition-colors"
          >
            Se deconnecter
          </button>
        </form>
      </div>

      {/* Parametres avances */}
      <details className="border-t border-border pt-6 group">
        <summary className="font-ui text-sm text-muted-foreground cursor-pointer hover:text-accent transition-colors list-none flex items-center gap-1.5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-transform group-open:rotate-90"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
          Parametres avances
        </summary>
        <div className="mt-6 space-y-10">
          <AdvancedSettings
            dailyCap={profile.daily_cap ?? 10}
            serendipityQuota={profile.serendipity_quota ?? 0.15}
          />

          <div className="flex items-center justify-between">
            <span className="font-ui text-sm text-foreground">Theme</span>
            <ThemeToggle />
          </div>

          <DigestToggle enabled={profile.digest_email ?? false} />
          <PushSubscribe />
          <TokensSection tokens={tokens} />
        </div>
      </details>
    </div>
  )
}
