import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ThemeToggle } from '@/components/ThemeToggle'
import { BottomNav } from '@/components/BottomNav'
import Link from 'next/link'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  // Bypass auth en dev local
  if (process.env.DEV_BYPASS_AUTH === 'true') {
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
      {/* Header : desktop visible, mobile visible sauf pages article (gere par BottomNav) */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 h-12 flex items-center justify-between">
          <Link
            href="/feed"
            className="font-logo text-xl tracking-tight text-foreground hover:text-accent transition-colors"
          >
            DISTIL
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/feed" className="hover:text-foreground transition-colors">Feed</Link>
            <Link href="/search" className="hover:text-foreground transition-colors">Recherche</Link>
            <Link href="/profile" className="hover:text-foreground transition-colors">Profil</Link>
          </nav>

          <ThemeToggle />
        </div>
      </header>

      {/* Contenu principal avec padding-bottom pour la BottomNav mobile */}
      <main className="flex-1 pb-14 md:pb-0">
        {children}
      </main>

      {/* Navigation mobile bas d'ecran */}
      <BottomNav />
    </div>
  )
}
