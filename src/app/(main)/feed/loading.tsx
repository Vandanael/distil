function ArticleSkeleton() {
  return (
    <div className="space-y-2 border-b border-border pb-6 last:border-0 animate-pulse">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-1.5">
          <div className="h-4 bg-muted rounded-none w-4/5" />
          <div className="h-4 bg-muted rounded-none w-3/5" />
        </div>
        <div className="h-4 w-6 bg-muted rounded-none shrink-0" />
      </div>
      <div className="flex items-center gap-3">
        <div className="h-3 w-20 bg-muted rounded-none" />
        <div className="h-3 w-10 bg-muted rounded-none" />
      </div>
      <div className="space-y-1">
        <div className="h-3 bg-muted rounded-none w-full" />
        <div className="h-3 bg-muted rounded-none w-4/5" />
      </div>
    </div>
  )
}

export default function FeedLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:py-12 space-y-10 w-full">
      {/* En-tete */}
      <div className="space-y-4 border-b border-border pb-8 animate-pulse">
        <div className="h-2.5 w-32 bg-muted rounded-none" />
        <div className="h-8 w-56 bg-muted rounded-none" />
        <div className="flex items-center gap-6">
          <div className="h-3 w-16 bg-muted rounded-none" />
          <div className="h-3 w-16 bg-muted rounded-none" />
        </div>
      </div>

      {/* Articles */}
      <div className="space-y-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <ArticleSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
