import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function OnboardingPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-10 p-8 bg-background">
      <div className="text-center space-y-3">
        <h1 className="font-[family-name:var(--font-fraunces)] text-4xl font-semibold text-foreground">
          Bienvenue dans Distil
        </h1>
        <p className="font-[family-name:var(--font-source-serif)] text-muted-foreground max-w-md">
          Dites-nous ce qui vous interesse pour personnaliser votre veille.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
        <Link href="/onboarding/express" data-testid="card-express">
          <Card className="cursor-pointer hover:border-primary transition-colors h-full">
            <CardHeader>
              <CardTitle className="font-[family-name:var(--font-fraunces)] text-xl">
                Rapide
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-[family-name:var(--font-source-serif)] text-sm text-muted-foreground">
                {"Une phrase sur vos centres d'interet. Moins de 30 secondes."}
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/onboarding/wizard" data-testid="card-wizard">
          <Card className="cursor-pointer hover:border-primary transition-colors h-full">
            <CardHeader>
              <CardTitle className="font-[family-name:var(--font-fraunces)] text-xl">
                Guide
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-[family-name:var(--font-source-serif)] text-sm text-muted-foreground">
                5 etapes pour definir vos sources, votre rythme et votre quota de serendipite.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </main>
  )
}
