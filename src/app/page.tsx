export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-16 bg-background text-foreground">
      <h1 className="font-[family-name:var(--font-fraunces)] text-5xl font-semibold text-foreground">
        Distil
      </h1>
      <p className="font-[family-name:var(--font-source-serif)] text-xl text-foreground/80">
        Moins de bruit, mieux lu. Veille intelligente anti-bulle.
      </p>
      <span className="font-[family-name:var(--font-geist)] text-sm text-muted-foreground uppercase tracking-widest">
        Sprint Zero - Squelette technique
      </span>
      <div className="flex gap-3 mt-4">
        <div className="h-6 w-16 rounded bg-primary" title="orange #D94E1F" />
        <div className="h-6 w-16 rounded bg-secondary" title="marine #11284B" />
        <div className="h-6 w-16 rounded border border-border bg-muted" title="muted #F0EDE6" />
      </div>
    </main>
  );
}
