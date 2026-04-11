'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <main className="flex min-h-full flex-col items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-4">
            <h1 className="font-logo uppercase text-6xl tracking-tight text-foreground">Distil</h1>
            <div className="h-0.5 w-10 bg-accent" />
          </div>
          <div className="space-y-2">
            <p className="font-body text-lg text-foreground">Lien envoyé.</p>
            <p className="font-ui text-sm text-muted-foreground">
              Vérifiez votre boite mail pour <span className="text-foreground">{email}</span>.
            </p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-full flex-col items-center justify-center p-8 bg-background">
      <div className="w-full max-w-sm space-y-10">
        {/* Masthead */}
        <div className="space-y-5">
          <div className="space-y-4">
            <h1 className="font-logo uppercase text-5xl md:text-7xl tracking-tight text-foreground">
              Distil
            </h1>
            <div className="h-0.5 w-10 bg-accent" />
          </div>
          <p className="font-body text-lg leading-relaxed text-muted-foreground">
            Votre veille quotidienne, sans le bruit.
          </p>
        </div>

        {/* Google OAuth */}
        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            className="w-full h-11 font-ui gap-3"
            onClick={handleGoogle}
            disabled={googleLoading}
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
            <div className="flex-1 h-px bg-border" />
            <span className="font-ui text-xs text-muted-foreground">ou</span>
            <div className="flex-1 h-px bg-border" />
          </div>
        </div>

        {/* Formulaire magic link */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="email"
            placeholder="vous@exemple.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            disabled={loading}
            className="h-11 text-base"
          />

          {error && <p className="font-ui text-xs text-destructive">{error}</p>}

          <Button type="submit" className="w-full h-11" disabled={loading || !email}>
            {loading ? 'Envoi en cours...' : 'Recevoir un lien magique'}
          </Button>
        </form>
      </div>
    </main>
  )
}
