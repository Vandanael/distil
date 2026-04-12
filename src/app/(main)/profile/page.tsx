import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileForm } from './ProfileForm'
import { TokensSection } from './TokensSection'
import { PushSubscribe } from '@/components/PushSubscribe'
import { listApiTokens } from './token-actions'
import { buildSearchQueries } from '@/lib/agents/discovery-agent'

export default async function ProfilePage() {
  if (
    process.env.DEV_BYPASS_AUTH === 'true' ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 md:py-12 space-y-10 w-full">
        <div className="space-y-4 border-b border-border pb-8">
          <p className="font-ui text-[10px] uppercase tracking-widest text-accent">Profil</p>
          <h1 className="font-ui text-4xl font-semibold leading-tight text-foreground">Preferences</h1>
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
      'profile_text, sector, interests, pinned_sources, daily_cap, serendipity_quota, show_scores, profile_structured'
    )
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/onboarding')

  const tokens = await listApiTokens()

  const structured = profile.profile_structured as Record<string, unknown> | null
  const language = structured?.language as 'fr' | 'en' | 'both' | undefined

  // Calcule les requetes que Distil utilisera au prochain refresh
  const searchQueries = buildSearchQueries({
    profileText: profile.profile_text ?? null,
    profileStructured: structured,
    sector: profile.sector ?? null,
    interests: profile.interests ?? [],
    pinnedSources: profile.pinned_sources ?? [],
    dailyCap: profile.daily_cap ?? 10,
    serendipityQuota: profile.serendipity_quota ?? 0.15,
  })

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 md:py-12 space-y-10 w-full">
      <div className="space-y-4 border-b border-border pb-8">
        <p className="font-ui text-[10px] uppercase tracking-widest text-accent">Profil</p>
        <h1 className="font-ui text-4xl font-semibold leading-tight text-foreground">Preferences</h1>
        <p className="font-body text-sm text-muted-foreground">{user.email}</p>
      </div>

      {/* Ce que Distil recherche */}
      {searchQueries.length > 0 && (
        <div className="border-t border-border pt-8 space-y-3">
          <p className="font-ui text-[10px] uppercase tracking-widest text-accent">
            Ce que Distil recherche
          </p>
          <p className="font-body text-xs text-muted-foreground">
            Requetes utilisees lors du prochain rafraichissement.
          </p>
          <ul className="space-y-1.5">
            {searchQueries.map((q, i) => (
              <li key={i} className="font-ui text-xs text-foreground/70 flex gap-2">
                <span className="text-muted-foreground/40 shrink-0 tabular-nums">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span>{q}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ProfileForm profile={{ ...profile, language }} />

      <div className="border-t border-border pt-8 space-y-8">
        <PushSubscribe />
        <TokensSection tokens={tokens} />
      </div>
    </div>
  )
}
