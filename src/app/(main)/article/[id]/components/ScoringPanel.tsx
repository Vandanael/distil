type Props = {
  score: number
  justification: string | null
  isSerendipity: boolean
}

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 70
      ? 'bg-emerald-500'
      : score >= 40
        ? 'bg-amber-400'
        : 'bg-red-400'

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1 bg-border rounded-none overflow-hidden">
        <div
          className={`h-full rounded-none transition-all ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="font-ui text-xs tabular-nums text-muted-foreground shrink-0">
        {score}<span className="text-[10px]">/100</span>
      </span>
    </div>
  )
}

export function ScoringPanel({ score, justification, isSerendipity }: Props) {
  return (
    <div
      className="space-y-3 rounded-none border border-border p-4 bg-muted/30"
      data-testid="scoring-panel"
    >
      <div className="flex items-center justify-between gap-4">
        <span className="font-ui text-[10px] uppercase tracking-widest text-muted-foreground">
          Score de pertinence
        </span>
        {isSerendipity && (
          <span
            className="font-ui text-[10px] uppercase tracking-wider text-accent"
            data-testid="serendipity-badge"
          >
            Decouverte
          </span>
        )}
      </div>

      <ScoreBar score={score} />

      {justification && (
        <p
          className="font-body text-sm text-muted-foreground italic leading-relaxed"
          data-testid="scoring-justification"
        >
          {justification}
        </p>
      )}
    </div>
  )
}
