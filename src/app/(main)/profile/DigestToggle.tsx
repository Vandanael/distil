'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { toggleDigestEmail } from './actions'

type Props = { enabled: boolean }

export function DigestToggle({ enabled: initial }: Props) {
  const [enabled, setEnabled] = useState(initial)
  const [pending, setPending] = useState(false)

  async function toggle() {
    setPending(true)
    try {
      await toggleDigestEmail(!enabled)
      setEnabled(!enabled)
      toast.success(enabled ? 'Digest desactive' : 'Digest active - chaque matin a 7h')
    } catch {
      toast.error('Erreur lors de la mise a jour')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <p className="font-ui text-sm font-medium text-foreground">Email digest</p>
        <p className="font-body text-xs text-muted-foreground">
          Recevez vos 5 meilleurs articles par email chaque matin.
        </p>
      </div>
      <button
        type="button"
        onClick={() => void toggle()}
        disabled={pending}
        data-testid="digest-toggle-btn"
        className={[
          'font-ui text-sm px-3 py-1.5 border transition-colors disabled:opacity-40',
          enabled
            ? 'border-accent text-accent hover:bg-accent/10'
            : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground',
        ].join(' ')}
      >
        {pending ? '...' : enabled ? 'Active' : 'Activer'}
      </button>
    </div>
  )
}
