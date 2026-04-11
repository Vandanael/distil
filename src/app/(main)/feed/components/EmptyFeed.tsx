'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Phase = 'searching' | 'none' | 'error'

export function EmptyFeed() {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('searching')

  useEffect(() => {
    let cancelled = false

    async function autoRefresh() {
      try {
        const res = await fetch('/api/feed/refresh', { method: 'POST' })
        if (cancelled) return
        if (!res.ok) {
          setPhase('error')
          return
        }
        const data = (await res.json()) as { accepted?: number }
        if (cancelled) return
        if ((data.accepted ?? 0) > 0) {
          router.refresh()
        } else {
          setPhase('none')
        }
      } catch {
        if (!cancelled) setPhase('error')
      }
    }

    void autoRefresh()
    return () => {
      cancelled = true
    }
  }, [router])

  if (phase === 'searching') {
    return (
      <div className="space-y-4 py-12">
        <p className="font-ui text-sm text-foreground font-medium">
          Distil cherche vos premiers articles...
        </p>
        <p className="font-body text-sm text-muted-foreground leading-relaxed">
          L&apos;analyse prend quelques instants. La page se mettra a jour automatiquement.
        </p>
        <div className="flex gap-1 pt-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="inline-block h-1 w-6 bg-accent/40 animate-pulse rounded-none"
              style={{ animationDelay: `${i * 200}ms` }}
            />
          ))}
        </div>
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div className="space-y-4 py-12">
        <p className="font-ui text-sm text-foreground font-medium">
          Impossible de charger les articles pour l&apos;instant.
        </p>
        <p className="font-body text-sm text-muted-foreground">
          Verifiez votre connexion et reessayez depuis votre{' '}
          <a href="/profile" className="text-accent hover:underline">
            profil
          </a>
          .
        </p>
      </div>
    )
  }

  // phase === 'none' : refresh OK mais 0 articles acceptes
  return (
    <div className="space-y-4 py-12">
      <p className="font-ui text-sm text-foreground font-medium">
        Aucun article pertinent trouve cette fois.
      </p>
      <p className="font-body text-sm text-muted-foreground leading-relaxed">
        Distil n&apos;a pas trouve d&apos;articles correspondant a votre profil lors de cette
        recherche. Enrichissez vos{' '}
        <a href="/profile" className="text-accent hover:underline">
          centres d&apos;interet
        </a>{' '}
        ou ajoutez des sources pour ameliorer les resultats.
      </p>
    </div>
  )
}
