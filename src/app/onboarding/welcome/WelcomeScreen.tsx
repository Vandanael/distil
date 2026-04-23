'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

const POLL_INTERVAL_MS = 2000
// 70s : marge sur le timeout serveur (60s) pour laisser le temps au flag
// first_edition_empty d'être positionné avant l'arrivée sur feed/page.tsx.
const FORCE_REDIRECT_MS = 70_000

export function WelcomeScreen() {
  const router = useRouter()

  useEffect(() => {
    let stopped = false

    const forceTimeout = setTimeout(() => {
      if (!stopped) {
        stopped = true
        router.push('/feed')
      }
    }, FORCE_REDIRECT_MS)

    async function poll() {
      if (stopped) return
      try {
        const res = await fetch('/api/feed/status')
        const data = (await res.json()) as { count: number }
        if (data.count >= 1) {
          stopped = true
          clearTimeout(forceTimeout)
          router.push('/feed')
          return
        }
      } catch {
        // continue polling
      }
      if (!stopped) setTimeout(poll, POLL_INTERVAL_MS)
    }

    setTimeout(poll, POLL_INTERVAL_MS)

    return () => {
      stopped = true
      clearTimeout(forceTimeout)
    }
  }, [router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl text-center leading-tight text-foreground">
        Distil lit vos sources.
      </h1>
      <p className="font-body text-base md:text-lg text-center mt-6 max-w-md text-muted-foreground">
        Moins d&apos;une minute la première fois. Instantané ensuite.
      </p>
    </div>
  )
}
