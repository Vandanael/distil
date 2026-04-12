'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const MAX_POLLS = 10
const POLL_INTERVAL = 1500

export default function WelcomePage() {
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
          <h1 className="font-ui text-5xl font-bold tracking-tight text-accent">Distil</h1>
        </div>

        {/* Message */}
        <div className="space-y-3">
          <p className="font-body text-lg text-foreground">
            {message}{dots}
          </p>
          <p className="font-body text-sm text-muted-foreground">
            Distil recherche vos premiers articles. Vous serez redirige automatiquement.
          </p>
        </div>

        {/* Lien direct */}
        <button
          type="button"
          onClick={() => router.push('/feed')}
          className="font-ui text-sm text-accent hover:underline transition-opacity"
        >
          Voir mon feed maintenant &rarr;
        </button>
      </div>
    </main>
  )
}
