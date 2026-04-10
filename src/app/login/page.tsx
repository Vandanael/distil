'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
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
      <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8 bg-background">
        <h1 className="font-[family-name:var(--font-fraunces)] text-3xl font-semibold text-foreground">
          Distil
        </h1>
        <div className="max-w-sm text-center space-y-3">
          <p className="font-[family-name:var(--font-source-serif)] text-foreground text-lg">
            Lien envoyé.
          </p>
          <p className="font-[family-name:var(--font-geist)] text-sm text-muted-foreground">
            Vérifiez votre boite mail pour{' '}
            <span className="text-foreground">{email}</span>.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8 bg-background">
      <div className="text-center space-y-2">
        <h1 className="font-[family-name:var(--font-fraunces)] text-4xl font-semibold text-foreground">
          Distil
        </h1>
        <p className="font-[family-name:var(--font-source-serif)] text-muted-foreground">
          Connexion par lien magique
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div className="space-y-2">
          <Label
            htmlFor="email"
            className="font-[family-name:var(--font-geist)] text-sm text-foreground"
          >
            Adresse email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="vous@exemple.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            disabled={loading}
          />
        </div>

        {error && (
          <p className="text-sm text-destructive font-[family-name:var(--font-geist)]">
            {error}
          </p>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={loading || !email}
        >
          {loading ? 'Envoi en cours...' : 'Recevoir un lien magique'}
        </Button>
      </form>
    </main>
  )
}
