'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const MAX_POLLS = 20
const POLL_INTERVAL = 1500

export function WelcomeScreen() {
  const router = useRouter()
  const [dots, setDots] = useState('.')
  const [message, setMessage] = useState('Votre veille est en preparation')

  // Animation des points
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '.' : d + '.'))
    }, 500)
    return () => clearInterval(interval)
  }, [])

  // Declenche le refresh puis poll jusqu'a ce que le feed ait des articles
  useEffect(() => {
    void fetch('/api/feed/refresh', { method: 'POST' })

    let polls = 0
    let stopped = false

    async function poll() {
      if (stopped) return
      try {
        const res = await fetch('/api/feed/status')
        const data = (await res.json()) as { count: number }
        if (data.count > 0) {
          stopped = true
          router.push('/feed')
          return
        }
      } catch {
        // continue polling
      }

      polls++
      if (polls >= MAX_POLLS) {
        stopped = true
        setMessage('Distil recherche encore vos articles')
        setTimeout(() => router.push('/feed'), 2000)
        return
      }

      setTimeout(poll, POLL_INTERVAL)
    }

    setTimeout(poll, POLL_INTERVAL)

    return () => {
      stopped = true
    }
  }, [router])

  return (
    <main className="flex min-h-full flex-col items-center justify-center p-8 bg-background">
      <div className="w-full max-w-sm space-y-10">
        {/* Logo */}
        <div className="space-y-4">
          <h1 className="font-display text-6xl md:text-7xl italic leading-[0.95] tracking-[-0.01em] text-accent">
            Distil
          </h1>
        </div>

        {/* Message */}
        <div className="space-y-3">
          <p className="font-body text-lg text-foreground">
            {message}
            {dots}
          </p>
          <p className="font-body text-sm text-muted-foreground">
            Distil recherche vos premiers articles. Vous serez redirige automatiquement.
          </p>
        </div>

        {/* Lien direct */}
        <button
          type="button"
          onClick={() => router.push('/feed')}
          className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground hover:text-accent transition-colors"
        >
          Voir mon feed maintenant &rarr;
        </button>

        {/* Astuce pedagogique boucle feedback */}
        <p className="font-body text-sm text-muted-foreground leading-[1.55] border-t border-border pt-6 text-pretty">
          <span className="font-ui text-[13px] uppercase tracking-[0.12em] text-accent mr-2">
            Astuce
          </span>
          Sur chaque carte, les boutons <span className="text-foreground">+</span> et{' '}
          <span className="text-foreground">×</span> ajustent votre feed du lendemain. L&apos;algo
          écoute, c&apos;est vous qui décidez ce qui compte.
        </p>
      </div>
    </main>
  )
}
