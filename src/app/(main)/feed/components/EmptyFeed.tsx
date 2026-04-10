export function EmptyFeed() {
  return (
    <div className="space-y-3 py-12">
      <p className="font-ui text-sm text-muted-foreground">Aucun article pour aujourd&apos;hui.</p>
      <p className="font-body text-sm text-muted-foreground">
        Lancez un run de scoring via{' '}
        <code className="font-ui text-xs text-foreground">POST /api/scoring/run</code> pour
        alimenter votre feed.
      </p>
    </div>
  )
}
