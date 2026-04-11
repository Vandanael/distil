'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const REDIRECT_DELAY = 4000

export default function WelcomePage() {
  const router = useRouter()
  const [dots, setDots] = useState('.')
  const [ready, setReady] = useState(false)

  // Animation des points
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '.' : d + '.'))
    }, 500)
    return () => clearInterval(interval)
  }, [])

  // Declenche le refresh en arriere-plan et redirige apres le delai
  useEffect(() => {
    void fetch('/api/feed/refresh', { method: 'POST' })

    const timeout = setTimeout(() => {
      setReady(true)
      router.push('/feed')
    }, REDIRECT_DELAY)

    return () => clearTimeout(timeout)
  }, [router])

  return (
    <main className="flex min-h-full flex-col items-center justify-center p-8 bg-background">
      <div className="w-full max-w-sm space-y-10">
        {/* Logo */}
        <div className="space-y-4">
          <h1 className="font-logo text-5xl uppercase tracking-tight text-foreground">Distil</h1>
          <div className="h-0.5 w-10 bg-accent" />
        </div>

        {/* Message */}
        <div className="space-y-3">
          <p className="font-body text-lg text-foreground">
            Votre veille est en preparation{dots}
          </p>
          <p className="font-body text-sm text-muted-foreground">
            Distil recherche vos premiers articles. Vous serez redirige automatiquement.
          </p>
        </div>

        {/* Lien direct */}
        <button
          type="button"
          onClick={() => router.push('/feed')}
          disabled={ready}
          className="font-ui text-sm text-accent hover:underline disabled:opacity-40 transition-opacity"
        >
          Voir mon feed maintenant &rarr;
        </button>
      </div>
    </main>
  )
}
