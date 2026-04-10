import Link from 'next/link'

export default function OnboardingPage() {
  return (
    <main className="flex min-h-full flex-col items-center justify-center p-8 bg-background">
      <div className="w-full max-w-lg space-y-12">
        {/* En-tete */}
        <div className="space-y-5">
          <p className="font-ui text-[10px] uppercase tracking-widest text-accent">
            Personnalisation
          </p>
          <h1 className="font-heading text-5xl font-semibold leading-tight text-foreground">
            Comment lisez-vous ?
          </h1>
          <div className="h-px bg-border" />
        </div>

        {/* Choix editoriaux — pas de cards */}
        <div className="space-y-10">
          <Link
            href="/onboarding/express"
            data-testid="card-express"
            className="group block space-y-2"
          >
            <div className="flex items-baseline gap-5">
              <span className="font-ui text-xs text-muted-foreground tabular-nums">01</span>
              <span className="font-heading text-3xl font-semibold text-foreground transition-colors group-hover:text-accent">
                Rapide &rarr;
              </span>
            </div>
            <p className="font-body text-base text-muted-foreground pl-9">
              {"Une phrase sur vos centres d'interet. Moins de 30 secondes."}
            </p>
          </Link>

          <Link
            href="/onboarding/wizard"
            data-testid="card-wizard"
            className="group block space-y-2"
          >
            <div className="flex items-baseline gap-5">
              <span className="font-ui text-xs text-muted-foreground tabular-nums">02</span>
              <span className="font-heading text-3xl font-semibold text-foreground transition-colors group-hover:text-accent">
                Guid&eacute; &rarr;
              </span>
            </div>
            <p className="font-body text-base text-muted-foreground pl-9">
              Sources, rythme, s&eacute;rendipite. Cinq minutes pour un feed sur mesure.
            </p>
          </Link>
        </div>
      </div>
    </main>
  )
}
