import Link from 'next/link'

export default function NotFound() {
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
              Erreur 404
            </span>
          </div>
        </header>

        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-5">
          Introuvable
        </p>
        <h1 className="font-display text-5xl md:text-7xl leading-[0.95] tracking-[-0.01em] text-foreground mb-8 text-balance">
          Cette page{' '}
          <em className="italic text-accent">a disparu.</em>
        </h1>
        <p className="font-body text-lg md:text-xl text-muted-foreground leading-[1.6] mb-12 text-pretty max-w-[48ch]">
          Elle n&apos;existe plus, ou l&apos;adresse est incorrecte. Rien d&apos;inquietant : le
          flux continue ailleurs.
        </p>

        <Link
          href="/"
          className="group inline-flex items-center gap-3 font-ui text-[15px] border-b-2 border-foreground pb-1 text-foreground hover:text-accent hover:border-accent transition-colors"
        >
          Retour a l&apos;accueil
          <span
            className="font-mono transition-transform group-hover:translate-x-1"
            aria-hidden="true"
          >
            →
          </span>
        </Link>
      </div>
    </main>
  )
}
