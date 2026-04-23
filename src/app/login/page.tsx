'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'

const ERROR_MESSAGES: Record<string, string> = {
  no_code: 'Lien de connexion invalide. Veuillez réessayer.',
  exchange_failed:
    'Échec de la connexion. Veuillez réessayer. Si le problème persiste, ouvrez une issue sur GitHub.',
  supabase_not_configured: 'Service temporairement indisponible. Réessayez dans quelques instants.',
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  )
}

function LoginPageInner() {
  const [googleLoading, setGoogleLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [magicLoading, setMagicLoading] = useState(false)
  const [magicSent, setMagicSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const urlErrorCode = searchParams.get('error')
  const urlError = urlErrorCode ? (ERROR_MESSAGES[urlErrorCode] ?? null) : null
  const displayError = error ?? urlError
  const loading = googleLoading || magicLoading

  async function handleGoogle() {
    setError(null)
    setGoogleLoading(true)
    const supabase = createClient()
    // skipBrowserRedirect : avec @supabase/ssr la redirection auto n'est pas garantie
    // (comportement variable entre versions). On navigue nous-memes vers data.url pour
    // eviter le "double clic" cote utilisateur.
    const { data, error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        skipBrowserRedirect: true,
      },
    })
    if (authError || !data?.url) {
      setError(authError?.message ?? 'Redirection Google impossible. Réessayez.')
      setGoogleLoading(false)
      return
    }
    window.location.href = data.url
  }

  async function handleMagicLink(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!EMAIL_RE.test(trimmed)) {
      setError('Adresse email invalide.')
      return
    }
    setError(null)
    setMagicLoading(true)
    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        shouldCreateUser: true,
      },
    })
    setMagicLoading(false)
    if (authError) {
      setError(authError.message)
      return
    }
    setMagicSent(true)
  }

  return (
    <main id="main-content" className="flex flex-1 flex-col bg-background">
      <PublicHeader contextLabel="Connexion" />
      <div className="flex-1 flex items-center justify-center px-5 md:px-8 py-12">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-4">
            <h1 className="font-heading text-5xl md:text-7xl tracking-tight text-accent leading-[1.05]">
              Distil
            </h1>
            <p className="font-body text-[16px] leading-[1.55] text-muted-foreground text-pretty">
              Votre veille quotidienne, <em className="italic text-foreground">sans le bruit.</em>
            </p>
          </div>

          <div className="space-y-4">
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 font-ui gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={handleGoogle}
              disabled={loading}
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

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="font-ui text-sm uppercase tracking-wider text-muted-foreground">
                ou
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {magicSent ? (
              <p
                role="status"
                aria-live="polite"
                className="font-ui text-[15px] text-foreground border-l-2 border-accent pl-3 py-2"
              >
                Lien envoyé. Ouvrez votre boîte mail et cliquez sur le lien pour vous connecter.
              </p>
            ) : (
              <form onSubmit={handleMagicLink} className="space-y-3" noValidate>
                <Label
                  htmlFor="magic-email"
                  className="font-ui text-sm uppercase tracking-wider text-muted-foreground"
                >
                  Recevoir un lien par email
                </Label>
                <Input
                  id="magic-email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="vous@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
                <Button
                  type="submit"
                  className="w-full h-11 font-ui disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={loading || !email.trim()}
                >
                  {magicLoading ? 'Envoi...' : 'Envoyer le lien'}
                </Button>
              </form>
            )}

            <p id="login-help" className="font-ui text-sm text-muted-foreground leading-relaxed">
              Connexion rapide et sécurisée. Distil ne partage aucune donnée au-delà de votre email
              et ne publie rien en votre nom.
            </p>

            {displayError && (
              <p
                id="login-error"
                role="alert"
                aria-live="polite"
                className="font-ui text-sm text-destructive border-l-2 border-destructive pl-3 py-1"
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
