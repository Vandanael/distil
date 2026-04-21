import { ensureOnboardingAccess } from './guard'
import { OnboardingForm } from './OnboardingForm'

// rankForUser + embedNewItems peuvent prendre jusqu'à 60s.
// Netlify coupe à 10s par défaut sans cette directive.
export const maxDuration = 90

export default async function OnboardingPage() {
  await ensureOnboardingAccess()
  return <OnboardingForm />
}
