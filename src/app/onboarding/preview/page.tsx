import Link from 'next/link'
import { PublicFooter } from '@/components/PublicFooter'
import { PublicHeader } from '@/components/PublicHeader'

// Page publique : aucune auth requise. Elle montre les deux questions reelles
// de l'onboarding pour lever la friction "c'est quoi le deal avant que je me
// connecte ?" (feedback panel 21 personae, pattern 8).

const QUESTIONS = [
  {
    kicker: 'Question 1',
    title: "Vos centres d'interet",
    body: 'Une ou deux phrases pour dire ce que vous voulez lire. Exemple : PM senior, produit, IA appliquee, startups B2B, sources primaires uniquement.',
    hint: 'Plus vous etes precis, plus le feed est pertinent.',
  },
  {
    kicker: 'Question 2',
    title: 'Vos sources preferees',
    body: 'Optionnel. Des domaines que vous voulez voir remonter : lemonde.fr, paulgraham.com, stratechery.com... Ou un fichier OPML si vous en avez un.',
    hint: 'Vous pouvez passer cette question et ajouter vos sources plus tard.',
  },
]

export default function OnboardingPreviewPage() {
  return (
    <main className="flex flex-1 flex-col bg-background">
      <PublicHeader contextLabel="Les 2 questions" />
      <div className="flex-1 px-5 md:px-8 py-12 md:py-16">
        <div className="w-full max-w-2xl mx-auto space-y-10 md:space-y-12">
          <header className="space-y-4">
            <p className="font-ui text-xs uppercase tracking-wider text-accent">
              Avant de commencer
            </p>
            <h1 className="font-heading text-4xl md:text-5xl leading-[1.1] tracking-tight text-foreground">
              Deux questions, une minute
            </h1>
            <p className="font-body text-base text-muted-foreground max-w-[52ch]">
              On vous pose seulement ce dont Distil a besoin pour calibrer votre feed. Rien
              n&apos;est envoye tant que vous ne cliquez pas sur Demarrer.
            </p>
          </header>

          <ol className="space-y-8 md:space-y-10">
            {QUESTIONS.map((q) => (
              <li
                key={q.kicker}
                className="border-t border-border pt-6 md:pt-7 space-y-3 md:space-y-4"
              >
                <p className="font-ui text-xs uppercase tracking-wider text-accent">{q.kicker}</p>
                <h2 className="font-ui text-2xl md:text-3xl font-bold leading-tight text-foreground">
                  {q.title}
                </h2>
                <p className="font-body text-base text-foreground leading-relaxed">{q.body}</p>
                <p className="font-body text-sm text-muted-foreground italic">{q.hint}</p>
              </li>
            ))}
          </ol>

          <div className="border-t border-border pt-6 md:pt-8 space-y-4">
            <Link
              href="/login"
              className="inline-flex items-center font-ui text-[15px] md:text-[16px] uppercase tracking-[0.08em] bg-foreground text-background px-6 py-3.5 md:px-7 md:py-4 hover:bg-accent focus-visible:bg-accent transition-colors"
            >
              Commencer
            </Link>
            <p className="font-ui text-[14px] text-subtle">
              1 minute, 2 questions, gratuit pendant la beta.
            </p>
          </div>
        </div>
      </div>
      <PublicFooter />
    </main>
  )
}
