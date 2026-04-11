function ResultSkeleton() {
  return (
    <div className="space-y-1.5 border-b border-border pb-4 animate-pulse">
      <div className="h-4 bg-muted rounded-none w-4/5" />
      <div className="flex gap-3">
        <div className="h-3 w-16 bg-muted rounded-none" />
        <div className="h-3 w-10 bg-muted rounded-none" />
      </div>
      <div className="h-3 bg-muted rounded-none w-full" />
    </div>
  )
}

export default function SearchLoading() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-10 space-y-8">
      <div className="h-7 w-28 bg-muted rounded-none animate-pulse" />
      <div className="h-10 bg-muted/50 rounded-none border border-border animate-pulse" />
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <ResultSkeleton key={i} />
        ))}
      </div>
    </main>
  )
}
