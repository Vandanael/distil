type Props = {
  interests: string[]
  sources: string[]
  dailyCap: number
  serendipityQuota: number
}

export function StepRecap({ interests, sources, dailyCap, serendipityQuota }: Props) {
  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h2 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-foreground">
          Votre profil
        </h2>
        <p className="font-[family-name:var(--font-source-serif)] text-sm text-muted-foreground">
          Verifiez vos choix avant de demarrer.
        </p>
      </div>

      {interests.length === 0 && sources.length === 0 && (
        <p className="font-body text-sm text-muted-foreground border-l-2 border-accent pl-3">
          Aucun centre d'intérêt ni source définis. Distil aura du mal à personnaliser votre feed.
        </p>
      )}

      <dl className="space-y-4">
        <div>
          <dt className="font-[family-name:var(--font-geist)] text-xs uppercase tracking-widest text-muted-foreground mb-1">
            Interets
          </dt>
          <dd className="font-[family-name:var(--font-source-serif)] text-sm text-foreground">
            {interests.length > 0 ? (
              interests.join(', ')
            ) : (
              <span className="text-muted-foreground italic">Non definis</span>
            )}
          </dd>
        </div>

        <div>
          <dt className="font-[family-name:var(--font-geist)] text-xs uppercase tracking-widest text-muted-foreground mb-1">
            Sources preferees
          </dt>
          <dd className="font-[family-name:var(--font-source-serif)] text-sm text-foreground">
            {sources.length > 0 ? (
              sources.join(', ')
            ) : (
              <span className="text-muted-foreground italic">Non definies</span>
            )}
          </dd>
        </div>

        <div>
          <dt className="font-[family-name:var(--font-geist)] text-xs uppercase tracking-widest text-muted-foreground mb-1">
            Articles par jour
          </dt>
          <dd className="font-[family-name:var(--font-source-serif)] text-sm text-foreground">
            {dailyCap}
          </dd>
        </div>

        <div>
          <dt className="font-[family-name:var(--font-geist)] text-xs uppercase tracking-widest text-muted-foreground mb-1">
            Quota de serendipite
          </dt>
          <dd className="font-[family-name:var(--font-source-serif)] text-sm text-foreground">
            {Math.round(serendipityQuota * 100)}%
          </dd>
        </div>
      </dl>
    </div>
  )
}
