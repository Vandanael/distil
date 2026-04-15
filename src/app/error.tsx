'use client'

import Link from 'next/link'

export default function GlobalError() {
  return (
    <main className="flex min-h-full flex-col items-center justify-center p-8 bg-background">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="font-ui text-5xl font-bold tracking-tight text-accent">Erreur</h1>
        <p className="font-body text-lg text-foreground">
          Quelque chose s&apos;est mal passe.
        </p>
        <Link
          href="/feed"
          className="inline-block font-ui text-sm text-muted-foreground transition-colors hover:text-accent"
        >
          &larr; Retour au feed
        </Link>
      </div>
    </main>
  )
}
