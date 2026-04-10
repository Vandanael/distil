'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
            <h1 className="font-heading text-6xl font-semibold italic tracking-tight text-foreground">
              Distil
            </h1>
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
            <h1 className="font-heading text-7xl font-semibold italic tracking-tight text-foreground">
              Distil
            </h1>
            <div className="h-0.5 w-10 bg-accent" />
          </div>
          <p className="font-body text-lg leading-relaxed text-muted-foreground">
            Votre veille. Triée par ce qui compte.
          </p>
        </div>

        {/* Formulaire */}
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
