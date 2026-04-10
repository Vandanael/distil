'use client'

type Props = {
  quota: number
  onChange: (quota: number) => void
}

const OPTIONS = [
  { value: 0, label: 'Aucune', desc: 'Uniquement ce qui correspond a votre profil.' },
  { value: 0.15, label: '15%', desc: 'Quelques decouvertes ponctuelles. Recommande.' },
  { value: 0.3, label: '30%', desc: 'Un tiers de votre feed sort de votre zone de confort.' },
  { value: 0.5, label: '50%', desc: 'Exploration active. Ideal pour casser les bulles.' },
]

export function StepSerendipity({ quota, onChange }: Props) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <h2 className="font-heading text-2xl font-semibold text-foreground">S&eacute;rendipite</h2>
        <p className="font-body text-sm text-muted-foreground">
          {
            "Quelle part d'articles hors de votre profil souhaitez-vous recevoir ? C'est une protection active contre les bulles de filtre."
          }
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2" data-testid="serendipity-options">
        {OPTIONS.map(({ value, label, desc }) => (
          <button
            key={value}
            type="button"
            onClick={() => onChange(value)}
            data-testid={`serendipity-${Math.round(value * 100)}`}
            className={[
              'flex flex-col gap-1 border p-4 text-left transition-colors',
              quota === value
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
