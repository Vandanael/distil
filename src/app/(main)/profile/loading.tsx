function FieldSkeleton() {
  return (
    <div className="space-y-1.5 animate-pulse">
      <div className="h-3 w-24 bg-muted rounded-none" />
      <div className="h-10 bg-muted/50 rounded-none border border-border" />
    </div>
  )
}

export default function ProfileLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 md:py-12 space-y-10 w-full">
      <div className="space-y-4 border-b border-border pb-8 animate-pulse">
        <div className="h-2.5 w-16 bg-muted rounded-none" />
        <div className="h-8 w-40 bg-muted rounded-none" />
        <div className="h-3 w-48 bg-muted rounded-none" />
      </div>
      <div className="space-y-6">
        <FieldSkeleton />
        <FieldSkeleton />
        <FieldSkeleton />
        <div className="h-24 bg-muted/50 rounded-none border border-border animate-pulse" />
        <FieldSkeleton />
      </div>
      <div className="border-t border-border pt-8 space-y-3 animate-pulse">
        <div className="h-2.5 w-36 bg-muted rounded-none" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-3 bg-muted rounded-none" style={{ width: `${70 + i * 5}%` }} />
        ))}
      </div>
    </div>
  )
}
