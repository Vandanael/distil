import { PublicFooter } from '@/components/PublicFooter'
import { PublicHeader } from '@/components/PublicHeader'

export const metadata = {
  title: 'Privacy Policy - Distil',
  description: 'Privacy policy and données personnelles - Distil news curation service.',
  robots: { index: true, follow: true },
  alternates: { canonical: '/privacy' },
}

export default function PrivacyPage() {
  return (
    <main className="flex-1 flex flex-col bg-background">
      <PublicHeader contextLabel="Confidentialité" />
      <div className="flex-1 w-full max-w-2xl mx-auto px-5 md:px-8 pt-12 md:pt-16 pb-10 md:pb-16">
        {/* EN condensed */}
        <section lang="en" className="mb-14 pb-12 border-b border-border">
          <h1 className="font-display text-4xl md:text-5xl leading-[0.95] tracking-[-0.01em] text-foreground mb-4">
            Privacy Policy
          </h1>
          <p className="font-ui text-[14px] text-muted-foreground mb-10">
            English summary - Last updated: April 21, 2026
          </p>
          <div className="space-y-4 font-body text-[15px] text-muted-foreground leading-[1.6] text-pretty">
            <p>
              This is a condensed English summary of Distil&apos;s privacy policy. The full version
              is available in French below.
            </p>
            <p>
              <strong className="text-foreground">Data collected:</strong> email address (via Google
              OAuth), reading profile (interests and RSS sources), article interactions (read, not
              interested, to read, liked), and server error logs for debugging purposes.
            </p>
            <p>
              <strong className="text-foreground">Purpose:</strong> authentication, personalized
              daily edition, profile refinement from your feedback, and optional digest emails. No
              advertising. No data resale.
            </p>
            <p>
              <strong className="text-foreground">Retention:</strong> data is kept while your
              account is active. On deletion, all personal data is removed within 30 days.
            </p>
            <p>
              <strong className="text-foreground">Sub-processors:</strong> Supabase (database and
              auth - EU region available), Google Gemini (article analysis - article text only, no
              personal data), Voyage AI (embeddings - same scope), Resend (email dispatch), Upstash
              Redis (rate limiting - no personal data stored), Netlify (hosting).
            </p>
            <p>
              <strong className="text-foreground">Your rights (GDPR):</strong> access, correction,
              deletion, and portability. Contact{' '}
              <a
                href="mailto:hello@distil.app"
                className="text-foreground hover:text-accent transition-colors underline underline-offset-[3px] hover:decoration-2"
              >
                hello@distil.app
              </a>{' '}
              or delete your account directly from app settings. For unresolved complaints, contact
              the CNIL (
              <a
                href="https://www.cnil.fr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground hover:text-accent transition-colors underline underline-offset-[3px] hover:decoration-2"
              >
                www.cnil.fr
              </a>
              ).
            </p>
            <p>
              <a
                href="#politique-fr"
                className="text-foreground hover:text-accent transition-colors underline underline-offset-[3px] hover:decoration-2"
              >
                Full privacy policy available in French below.
              </a>
            </p>
          </div>
        </section>

        {/* FR complète */}
        <div id="politique-fr" className="scroll-mt-8">
          <h2 className="font-display text-4xl md:text-5xl leading-[0.95] tracking-[-0.01em] text-foreground mb-4 pt-2">
            Politique de confidentialité
          </h2>
          <p className="font-ui text-[14px] text-muted-foreground mb-12">
            Dernière mise à jour : 21 avril 2026
          </p>

          <section className="mb-10 space-y-4">
            <h3 className="font-ui text-[15px] text-accent uppercase tracking-[0.12em]">
              1. Responsable du traitement
            </h3>
            <p className="font-body text-[15px] text-muted-foreground leading-[1.6] text-pretty">
              Distil est un service en version bêta opéré à titre personnel. Pour toute question
              relative à vos données, contactez{' '}
              <a
                href="mailto:hello@distil.app"
                className="text-foreground hover:text-accent transition-colors underline underline-offset-[3px] hover:decoration-2"
              >
                hello@distil.app
              </a>
              .
            </p>
          </section>

          <section className="mb-10 space-y-4">
            <h3 className="font-ui text-[15px] text-accent uppercase tracking-[0.12em]">
              2. Données collectées
            </h3>
            <p className="font-body text-[15px] text-muted-foreground leading-[1.6]">
              Distil collecte uniquement les données nécessaires au fonctionnement du service :
            </p>
            <ul className="space-y-3 font-body text-[15px] text-muted-foreground leading-[1.6]">
              <li className="flex gap-3">
                <span
                  className="mt-[0.4em] w-1.5 h-1.5 rounded-full bg-border shrink-0"
                  aria-hidden
                />
                <span>
                  <strong className="text-foreground">Identité</strong> - adresse email, fournie
                  lors de la connexion via Google OAuth.
                </span>
              </li>
              <li className="flex gap-3">
                <span
                  className="mt-[0.4em] w-1.5 h-1.5 rounded-full bg-border shrink-0"
                  aria-hidden
                />
                <span>
                  <strong className="text-foreground">Profil de veille</strong> - centres
                  d&apos;intérêt et sources RSS renseignés lors de l&apos;onboarding ou mis à jour
                  dans les paramètres.
                </span>
              </li>
              <li className="flex gap-3">
                <span
                  className="mt-[0.4em] w-1.5 h-1.5 rounded-full bg-border shrink-0"
                  aria-hidden
                />
                <span>
                  <strong className="text-foreground">Interactions avec les articles</strong> -
                  statuts (lu, pas intéressé, à lire, plus comme ça) et horodatage associé.
                </span>
              </li>
              <li className="flex gap-3">
                <span
                  className="mt-[0.4em] w-1.5 h-1.5 rounded-full bg-border shrink-0"
                  aria-hidden
                />
                <span>
                  <strong className="text-foreground">Données techniques</strong> - logs
                  d&apos;erreurs serveur (table interne, non partagée).
                </span>
              </li>
            </ul>
            <p className="font-body text-[15px] text-muted-foreground leading-[1.6] text-pretty">
              Aucun cookie de tracking tiers, aucune donnée de navigation, aucun identifiant
              publicitaire.
            </p>
          </section>

          <section className="mb-10 space-y-4">
            <h3 className="font-ui text-[15px] text-accent uppercase tracking-[0.12em]">
              3. Finalité du traitement
            </h3>
            <ul className="space-y-3 font-body text-[15px] text-muted-foreground leading-[1.6]">
              <li className="flex gap-3">
                <span
                  className="mt-[0.4em] w-1.5 h-1.5 rounded-full bg-border shrink-0"
                  aria-hidden
                />
                <span>Authentification et accès au service</span>
              </li>
              <li className="flex gap-3">
                <span
                  className="mt-[0.4em] w-1.5 h-1.5 rounded-full bg-border shrink-0"
                  aria-hidden
                />
                <span>Personnalisation de l&apos;édition quotidienne (scoring, ranking)</span>
              </li>
              <li className="flex gap-3">
                <span
                  className="mt-[0.4em] w-1.5 h-1.5 rounded-full bg-border shrink-0"
                  aria-hidden
                />
                <span>Amélioration du profil de veille selon vos retours</span>
              </li>
              <li className="flex gap-3">
                <span
                  className="mt-[0.4em] w-1.5 h-1.5 rounded-full bg-border shrink-0"
                  aria-hidden
                />
                <span>Envoi optionnel d&apos;emails de digest</span>
              </li>
            </ul>
          </section>

          <section className="mb-10 space-y-4">
            <h3 className="font-ui text-[15px] text-accent uppercase tracking-[0.12em]">
              4. Durée de conservation
            </h3>
            <p className="font-body text-[15px] text-muted-foreground leading-[1.6] text-pretty">
              Les données sont conservées tant que votre compte est actif. En cas de suppression du
              compte, l&apos;ensemble des données personnelles est effacé sous 30 jours.
            </p>
          </section>

          <section className="mb-10 space-y-4">
            <h3 className="font-ui text-[15px] text-accent uppercase tracking-[0.12em]">
              5. Sous-traitants
            </h3>
            <p className="font-body text-[15px] text-muted-foreground leading-[1.6] mb-4">
              Distil fait appel aux prestataires suivants dans le cadre du service :
            </p>
            <ul className="space-y-3 font-body text-[15px] text-muted-foreground leading-[1.6]">
              <li className="flex gap-3">
                <span
                  className="mt-[0.4em] w-1.5 h-1.5 rounded-full bg-border shrink-0"
                  aria-hidden
                />
                <span>
                  <strong className="text-foreground">Supabase</strong> - base de données, stockage
                  et authentification (serveurs en UE disponibles).
                </span>
              </li>
              <li className="flex gap-3">
                <span
                  className="mt-[0.4em] w-1.5 h-1.5 rounded-full bg-border shrink-0"
                  aria-hidden
                />
                <span>
                  <strong className="text-foreground">Google (Gemini)</strong> - analyse sémantique
                  et scoring des articles. Les textes d&apos;articles sont transmis ; aucune donnée
                  personnelle identifiante ne l&apos;est.
                </span>
              </li>
              <li className="flex gap-3">
                <span
                  className="mt-[0.4em] w-1.5 h-1.5 rounded-full bg-border shrink-0"
                  aria-hidden
                />
                <span>
                  <strong className="text-foreground">Voyage AI</strong> - génération
                  d&apos;embeddings pour la recherche sémantique. Même cadre que Gemini.
                </span>
              </li>
              <li className="flex gap-3">
                <span
                  className="mt-[0.4em] w-1.5 h-1.5 rounded-full bg-border shrink-0"
                  aria-hidden
                />
                <span>
                  <strong className="text-foreground">Resend</strong> - envoi des emails de digest
                  (email uniquement).
                </span>
              </li>
              <li className="flex gap-3">
                <span
                  className="mt-[0.4em] w-1.5 h-1.5 rounded-full bg-border shrink-0"
                  aria-hidden
                />
                <span>
                  <strong className="text-foreground">Upstash Redis</strong> - rate limiting (aucune
                  donnée personnelle stockée).
                </span>
              </li>
              <li className="flex gap-3">
                <span
                  className="mt-[0.4em] w-1.5 h-1.5 rounded-full bg-border shrink-0"
                  aria-hidden
                />
                <span>
                  <strong className="text-foreground">Netlify</strong> - hébergement de
                  l&apos;application.
                </span>
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h3 className="font-ui text-[15px] text-accent uppercase tracking-[0.12em]">
              6. Vos droits
            </h3>
            <p className="font-body text-[15px] text-muted-foreground leading-[1.6] text-pretty">
              Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification,
              d&apos;effacement et de portabilité de vos données. Pour exercer ces droits, écrivez à{' '}
              <a
                href="mailto:hello@distil.app"
                className="text-foreground hover:text-accent transition-colors underline underline-offset-[3px] hover:decoration-2"
              >
                hello@distil.app
              </a>
              . Vous pouvez également supprimer directement votre compte depuis les paramètres de
              l&apos;application.
            </p>
            <p className="font-body text-[15px] text-muted-foreground leading-[1.6] text-pretty">
              En cas de réclamation non résolue, vous pouvez saisir la CNIL (
              <a
                href="https://www.cnil.fr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground hover:text-accent transition-colors underline underline-offset-[3px] hover:decoration-2"
              >
                www.cnil.fr
              </a>
              ).
            </p>
          </section>
        </div>
      </div>
      <PublicFooter />
    </main>
  )
}
