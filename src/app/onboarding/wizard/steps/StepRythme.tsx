'use client'

type Props = {
  dailyCap: number
  onChange: (cap: number) => void
}

const OPTIONS = [
  { value: 5, label: '5 articles', desc: 'Lecteur selectif' },
  { value: 10, label: '10 articles', desc: 'Rythme equilibre' },
  { value: 20, label: '20 articles', desc: 'Veille soutenue' },
  { value: 30, label: '30 articles', desc: 'Absorption maximale' },
]

export function StepRythme({ dailyCap, onChange }: Props) {
  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h2 className="font-heading text-2xl font-semibold text-foreground">Votre rythme</h2>
        <p className="font-body text-sm text-muted-foreground">
          {"Combien d'articles voulez-vous recevoir par jour ?"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2" data-testid="rythme-options">
        {OPTIONS.map(({ value, label, desc }) => (
          <button
            key={value}
            type="button"
            onClick={() => onChange(value)}
            data-testid={`cap-${value}`}
            className={[
              'flex flex-col gap-1 border p-4 text-left transition-colors',
              dailyCap === value
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-foreground/30',
            ].join(' ')}
          >
            <span className="font-ui text-sm font-semibold text-foreground">{label}</span>
            <span className="font-body text-xs text-muted-foreground">{desc}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
