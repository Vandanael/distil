export default function ArticleLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 md:py-16 space-y-8 animate-pulse">
      {/* Retour */}
      <div className="h-3 w-24 bg-muted rounded-none" />

      {/* Titre */}
      <div className="space-y-3">
        <div className="h-7 bg-muted rounded-none w-full" />
        <div className="h-7 bg-muted rounded-none w-4/5" />
        <div className="h-7 bg-muted rounded-none w-3/5" />
      </div>

      {/* Meta */}
      <div className="flex items-center gap-4">
        <div className="h-3 w-24 bg-muted rounded-none" />
        <div className="h-3 w-16 bg-muted rounded-none" />
      </div>

      {/* Score panel */}
      <div className="h-16 bg-muted/50 rounded-none border border-border" />

      {/* Corps */}
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-4 bg-muted rounded-none"
            style={{ width: i % 5 === 4 ? '60%' : '100%' }}
          />
        ))}
      </div>
    </div>
  )
}
