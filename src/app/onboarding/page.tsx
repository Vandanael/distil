import { ensureOnboardingAccess } from './guard'
import { OnboardingForm } from './OnboardingForm'

export default async function OnboardingPage() {
  await ensureOnboardingAccess()
  return <OnboardingForm />
}
