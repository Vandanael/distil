import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-full flex-col items-center justify-center p-8 bg-background">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="font-ui text-5xl font-bold tracking-tight text-accent">404</h1>
        <p className="font-body text-lg text-foreground">Page introuvable.</p>
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
