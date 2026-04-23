'use client'

import { signOut } from '@/app/(main)/profile/actions'

export function SignOutButton({ label }: { label: string }) {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="font-ui text-sm text-subtle hover:text-destructive transition-colors px-2"
      >
        {label}
      </button>
    </form>
  )
}
