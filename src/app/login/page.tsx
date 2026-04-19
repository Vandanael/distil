'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'

const ERROR_MESSAGES: Record<string, string> = {
  no_code: 'Lien de connexion invalide. Veuillez reessayer.',
  exchange_failed:
    'Echec de la connexion. Veuillez reessayer. Si le probleme persiste, ouvrez une issue sur GitHub.',
  supabase_not_configured: 'Service temporairement indisponible. Reessayez dans quelques instants.',
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  )
}

function LoginPageInner() {
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const urlErrorCode = searchParams.get('error')
  const urlError = urlErrorCode ? (ERROR_MESSAGES[urlErrorCode] ?? null) : null
  const displayError = error ?? urlError

  async function handleGoogle() {
    setError(null)
    setGoogleLoading(true)
    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (authError) {
      setError(authError.message)
      setGoogleLoading(false)
    }
  }

  return (
    <main className="flex flex-1 flex-col bg-background">
      <div className="pt-5 md:pt-10">
        <PublicHeader contextLabel="Connexion" />
      </div>
      <div className="flex-1 flex items-center justify-center px-5 md:px-8 py-12">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-4">
            <h1 className="font-display text-4xl md:text-5xl leading-[0.95] tracking-[-0.01em] text-foreground text-balance">
              Connexion à <span className="italic text-accent">Distil</span>.
            </h1>
            <p className="font-body text-[16px] leading-[1.55] text-muted-foreground text-pretty">
              Votre veille quotidienne,{' '}
              <em className="italic text-foreground">sans le bruit.</em>
            </p>
          </div>

          <div className="space-y-4">
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 font-ui gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={handleGoogle}
              disabled={googleLoading}
              aria-describedby="login-help"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path
                  d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
                  fill="#4285F4"
                />
                <path
                  d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
                  fill="#34A853"
                />
                <path
                  d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
                  fill="#FBBC05"
                />
                <path
                  d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
                  fill="#EA4335"
                />
              </svg>
              {googleLoading ? 'Redirection...' : 'Continuer avec Google'}
            </Button>

            <p id="login-help" className="font-ui text-xs text-muted-foreground leading-relaxed">
              Connexion rapide et securisee via Google. Distil ne partage aucune donnee au-dela de
              votre email et ne publie rien en votre nom.
            </p>

            {displayError && (
              <p
                id="login-error"
                role="alert"
                aria-live="polite"
                className="font-ui text-xs text-destructive border-l-2 border-destructive pl-3 py-1"
              >
                {displayError}
              </p>
            )}
          </div>
        </div>
      </div>
      <PublicFooter />
    </main>
  )
}
