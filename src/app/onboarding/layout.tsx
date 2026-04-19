import { ThemeToggle } from '@/components/ThemeToggle'

// Layout purement UI : l'auth guard est applique par chaque page protegee
// (onboarding/page.tsx, onboarding/welcome/page.tsx) via ensureOnboardingAccess().
// La page /onboarding/preview reste publique.
export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="fixed top-3 right-3">
        <ThemeToggle />
      </div>
      {children}
    </>
  )
}
