// Sprint 2 : l'agent de scoring sera branche ici
export default function FeedPage() {
  return (
    <main className="flex min-h-full flex-col p-8 md:p-16 bg-background">
      <div className="w-full max-w-2xl space-y-10">
        {/* En-tete editorial */}
        <div className="space-y-4 border-b border-border pb-8">
          <p className="font-ui text-[10px] uppercase tracking-widest text-accent">Feed</p>
          <h1 className="font-heading text-5xl font-semibold leading-tight text-foreground">
            Votre veille du jour
          </h1>
          <p className="font-body text-base text-muted-foreground">
            {"L'agent de scoring arrive au Sprint 2. En attendant, configurez votre profil."}
          </p>
        </div>

        {/* Placeholder articles */}
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2 border-b border-border pb-6 last:border-0">
              <div className="h-3 w-3/4 bg-muted" />
              <div className="h-3 w-1/2 bg-muted" />
              <div className="h-2 w-1/4 bg-muted/60" />
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
