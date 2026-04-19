import { ensureOnboardingAccess } from '../guard'
import { WelcomeScreen } from './WelcomeScreen'

export default async function WelcomePage() {
  await ensureOnboardingAccess()
  return <WelcomeScreen />
}
