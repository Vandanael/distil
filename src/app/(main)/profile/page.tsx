import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileForm } from './ProfileForm'
import { TokensSection } from './TokensSection'
import { PushSubscribe } from '@/components/PushSubscribe'
import { ThemeToggle } from '@/components/ThemeToggle'
import { listApiTokens } from './token-actions'
import { buildSearchQueries } from '@/lib/agents/profile-queries'
import { signOut } from './actions'
import { DigestToggle } from './DigestToggle'
import { OPMLImport } from './OPMLImport'

export default async function ProfilePage() {
  if (
    process.env.DEV_BYPASS_AUTH === 'true' ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 md:py-12 space-y-10 w-full">
        <div className="space-y-4 border-b border-border pb-8">
          <p className="font-ui text-xs text-accent">Profil</p>
          <h1 className="font-ui text-3xl font-bold leading-tight text-foreground">Préférences</h1>
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
      'profile_text, interests, pinned_sources, daily_cap, serendipity_quota, show_scores, profile_structured, digest_email'
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
    sector: null,
    interests: profile.interests ?? [],
    pinnedSources: profile.pinned_sources ?? [],
    dailyCap: profile.daily_cap ?? 10,
    serendipityQuota: profile.serendipity_quota ?? 0.15,
  })

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 md:py-12 space-y-10 w-full">
      <div className="space-y-4 border-b border-border pb-8">
        <p className="font-ui text-xs text-accent">Profil</p>
        <h1 className="font-ui text-3xl font-bold leading-tight text-foreground">Preferences</h1>
        <p className="font-body text-sm text-muted-foreground">{user.email}</p>
      </div>

      {/* Ce que Distil recherche */}
      {searchQueries.length > 0 && (
        <div className="border-t border-border pt-8 space-y-3">
          <p className="font-ui text-xs text-accent">
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

      <ProfileForm profile={{
        profile_text: profile.profile_text,
        interests: profile.interests ?? [],
        pinned_sources: profile.pinned_sources ?? [],
        daily_cap: profile.daily_cap ?? 10,
        serendipity_quota: profile.serendipity_quota ?? 0.15,
        show_scores: profile.show_scores ?? true,
        language,
      }} />

      {/* Import OPML */}
      <div className="border-t border-border pt-8 space-y-4">
        <p className="font-ui text-xs text-accent">Sources RSS</p>
        <OPMLImport />
      </div>

      {/* Navigation secondaire */}
      <div className="border-t border-border pt-8 space-y-3">
        <Link href="/archive" className="block font-ui text-sm text-foreground hover:text-accent transition-colors">
          Archives
        </Link>
        <Link href="/highlights" className="block font-ui text-sm text-foreground hover:text-accent transition-colors">
          Highlights
        </Link>
        <Link href="/rejected" className="block font-ui text-sm text-foreground hover:text-accent transition-colors">
          Articles rejetes
        </Link>
      </div>

      {/* Reglages */}
      <div className="border-t border-border pt-8 space-y-6">
        <div className="flex items-center justify-between">
          <span className="font-ui text-sm text-foreground">Theme</span>
          <ThemeToggle />
        </div>
        <PushSubscribe />
        <DigestToggle enabled={profile.digest_email ?? false} />
        <TokensSection tokens={tokens} />
        <p className="font-ui text-xs text-muted-foreground">
          Raccourcis clavier : j/k naviguer, Enter ouvrir, d rejeter, Esc retour, h highlight (dans un article)
        </p>
      </div>

      <div className="border-t border-border pt-8">
        <form action={signOut}>
          <button
            type="submit"
            className="font-ui text-sm text-muted-foreground hover:text-destructive transition-colors"
          >
            Se deconnecter
          </button>
        </form>
      </div>
    </div>
  )
}
