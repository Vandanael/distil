export default function OnboardingLoading() {
  return (
    <main className="flex min-h-full flex-col items-center justify-center p-8 bg-background">
      <div className="w-full max-w-lg space-y-10 animate-pulse">
        <div className="space-y-4">
          <div className="h-3 w-24 bg-muted rounded" />
          <div className="h-10 w-3/4 bg-muted rounded" />
          <div className="h-4 w-full bg-muted rounded" />
          <div className="h-px bg-border" />
        </div>
        <div className="space-y-8">
          <div className="h-60 bg-muted rounded" />
          <div className="h-10 bg-muted rounded" />
          <div className="h-24 bg-muted rounded" />
          <div className="flex gap-2">
            <div className="h-9 w-20 bg-muted rounded" />
            <div className="h-9 w-20 bg-muted rounded" />
            <div className="h-9 w-20 bg-muted rounded" />
          </div>
          <div className="h-11 w-full bg-muted rounded" />
        </div>
      </div>
    </main>
  )
}
