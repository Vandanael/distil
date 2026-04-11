function RowSkeleton() {
  return (
    <div className="flex items-start justify-between gap-4 py-4 border-b border-border animate-pulse">
      <div className="flex-1 space-y-1.5">
        <div className="h-4 bg-muted rounded-none w-3/4" />
        <div className="flex gap-3">
          <div className="h-3 w-16 bg-muted rounded-none" />
          <div className="h-3 w-12 bg-muted rounded-none" />
        </div>
      </div>
      <div className="h-3 w-20 bg-muted rounded-none shrink-0" />
    </div>
  )
}

export default function ArchiveLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:py-12 space-y-10 w-full">
      <div className="space-y-4 border-b border-border pb-8 animate-pulse">
        <div className="h-8 w-32 bg-muted rounded-none" />
        <div className="flex gap-6">
          <div className="h-3 w-20 bg-muted rounded-none" />
          <div className="h-3 w-28 bg-muted rounded-none" />
        </div>
      </div>
      <div>
        {Array.from({ length: 8 }).map((_, i) => (
          <RowSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
