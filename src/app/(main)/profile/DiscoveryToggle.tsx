'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useLocale } from '@/lib/i18n/context'
import { toggleDiscoveryMode } from './actions'
import { Spinner } from '@/components/ui/spinner'

type Props = { mode: 'active' | 'sources_first' }

export function DiscoveryToggle({ mode: initial }: Props) {
  const { t } = useLocale()
  const [mode, setMode] = useState<'active' | 'sources_first'>(initial)
  const [pending, setPending] = useState(false)

  const active = mode === 'active'

  async function toggle() {
    const next: 'active' | 'sources_first' = active ? 'sources_first' : 'active'
    setPending(true)
    try {
      await toggleDiscoveryMode(next)
      setMode(next)
      toast.success(next === 'active' ? t.profile.discoveryOn : t.profile.discoveryOff)
    } catch {
      toast.error('Erreur lors de la mise à jour')
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="font-ui text-sm font-medium text-foreground">
            {t.profile.sectionDiscovery}
          </p>
          <p className="font-body text-sm text-muted-foreground">
            {t.profile.sectionDiscoveryHint}
          </p>
          <p className="font-body text-sm text-muted-foreground/80">
            {active ? t.profile.discoveryOn : t.profile.discoveryOff}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void toggle()}
          disabled={pending}
          data-testid="discovery-toggle-btn"
          className={[
            'inline-flex items-center justify-center font-ui text-sm px-3 py-1.5 border transition-colors disabled:opacity-40 shrink-0',
            active
              ? 'border-accent text-accent hover:bg-accent/10'
              : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground',
          ].join(' ')}
        >
          {pending ? <Spinner className="size-4" /> : active ? 'Active' : 'Activer'}
        </button>
      </div>
    </section>
  )
}
