import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ThemeToggle } from '@/components/ThemeToggle'
import { BetaAccessForm } from './BetaAccessForm'

export const metadata: Metadata = {
  title: 'Acces beta - Distil',
  robots: { index: false, follow: false },
}

export default async function BetaAccessPage() {
  const cookieStore = await cookies()
  if (cookieStore.get('beta_access')?.value === '1') {
    redirect('/')
  }

  return (
    <main className="min-h-dvh bg-background flex flex-col">
      <header className="flex items-center justify-end p-5">
        <ThemeToggle />
      </header>
      <div className="flex-1 flex items-center justify-center px-6 pb-20">
        <div className="w-full max-w-sm flex flex-col items-center gap-10">
          <div
            aria-hidden
            className="flex h-20 w-20 items-center justify-center bg-foreground font-heading text-5xl leading-none text-background"
          >
            D
          </div>

          <div className="flex flex-col items-center gap-3 text-center">
            <h1 className="font-heading text-3xl font-semibold text-foreground">Acces beta</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Distil est en acces restreint. Entrez votre code d&apos;invitation pour continuer.
            </p>
          </div>

          <div className="w-full">
            <BetaAccessForm />
          </div>
        </div>
      </div>
    </main>
  )
}
