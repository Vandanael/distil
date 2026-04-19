'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[app/error] runtime error', {
      message: error.message,
      digest: error.digest,
    })
  }, [error])

  return (
    <main className="min-h-full flex flex-col bg-background">
      <div className="w-full max-w-2xl mx-auto flex-1 px-5 md:px-8 py-5 md:py-10">
        <header className="border-t-2 border-foreground pt-3 mb-16 md:mb-20">
          <div className="flex items-baseline gap-3 md:gap-5 min-w-0">
            <Link
              href="/"
              className="font-display text-2xl md:text-3xl leading-none text-accent italic hover:opacity-80 transition-opacity"
            >
              Distil
            </Link>
            <span className="text-border" aria-hidden="true">
              |
            </span>
            <span className="font-mono text-[11px] tracking-wider uppercase text-muted-foreground">
              Incident
            </span>
          </div>
        </header>

        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-5">
          Erreur technique
        </p>
        <h1 className="font-display text-5xl md:text-7xl leading-[0.95] tracking-[-0.01em] text-foreground mb-8 text-balance">
          Quelque chose <em className="italic text-accent">s&apos;est casse.</em>
        </h1>
        <p className="font-body text-lg md:text-xl text-muted-foreground leading-[1.6] mb-12 text-pretty max-w-[48ch]">
          L&apos;incident a ete signale. Vous pouvez reessayer ou revenir a l&apos;accueil.
        </p>

        <div className="flex flex-wrap items-center gap-8">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center font-ui text-[15px] border-b-2 border-foreground pb-1 text-foreground hover:text-accent hover:border-accent transition-colors"
          >
            Reessayer
          </button>
          <Link
            href="/"
            className="font-ui text-[15px] text-subtle hover:text-accent transition-colors"
          >
            Accueil
          </Link>
        </div>
      </div>
    </main>
  )
}
