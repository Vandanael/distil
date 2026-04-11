import Link from 'next/link'

export function EmptyFeed() {
  return (
    <div className="space-y-6 py-12">
      <div className="space-y-2">
        <p className="font-ui text-sm text-foreground font-medium">
          Distil n&apos;a pas encore d&apos;articles pour vous.
        </p>
        <p className="font-body text-sm text-muted-foreground leading-relaxed">
          Deux façons d&apos;alimenter votre feed :
        </p>
      </div>

      <div className="space-y-4 border-l-2 border-border pl-4">
        <div className="space-y-1">
          <p className="font-ui text-sm text-foreground">
            1. Sauvegardez un article avec le bookmarklet
          </p>
          <p className="font-body text-xs text-muted-foreground">
            Installez-le depuis votre{' '}
            <Link href="/profile" className="text-accent hover:underline">
              profil
            </Link>
            , puis cliquez dessus sur n&apos;importe quelle page web.
          </p>
        </div>

        <div className="space-y-1">
          <p className="font-ui text-sm text-foreground">
            2. Lancez le scoring depuis votre profil
          </p>
          <p className="font-body text-xs text-muted-foreground">
            Collez des URLs d&apos;articles, Distil les analyse et les score selon vos centres
            d&apos;intérêt.
          </p>
        </div>
      </div>

      <Link href="/profile" className="inline-block font-ui text-sm text-accent hover:underline">
        Aller au profil &rarr;
      </Link>
    </div>
  )
}
