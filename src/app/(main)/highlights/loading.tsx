function BlockquoteSkeleton() {
  return (
    <div className="space-y-2 border-b border-border pb-8 animate-pulse">
      <div className="border-l-2 border-accent/30 pl-4 space-y-1.5">
        <div className="h-3 bg-muted rounded-none w-full" />
        <div className="h-3 bg-muted rounded-none w-5/6" />
        <div className="h-3 bg-muted rounded-none w-2/3" />
      </div>
      <div className="h-3 w-24 bg-muted rounded-none" />
    </div>
  )
}

export default function HighlightsLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:py-12 space-y-10 w-full">
      <div className="space-y-4 border-b border-border pb-8 animate-pulse">
        <div className="h-8 w-36 bg-muted rounded-none" />
        <div className="h-3 w-28 bg-muted rounded-none" />
      </div>
      <div className="space-y-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <BlockquoteSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
