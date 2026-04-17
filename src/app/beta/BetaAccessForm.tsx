'use client'

import { useState, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { grantBetaAccess } from './actions'

export function BetaAccessForm() {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  async function onSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await grantBetaAccess(formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-3">
      <label htmlFor="beta-code" className="sr-only">
        Code d&apos;invitation
      </label>
      <Input
        id="beta-code"
        name="code"
        type="text"
        inputMode="numeric"
        autoComplete="off"
        autoFocus
        required
        placeholder="Code d'invitation"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? 'beta-error' : undefined}
        className="h-12 text-base"
      />
      <Button type="submit" disabled={pending} className="h-12">
        {pending ? 'Verification...' : 'Entrer'}
      </Button>
      {error && (
        <p id="beta-error" role="alert" className="text-sm text-accent">
          {error}
        </p>
      )}
    </form>
  )
}
