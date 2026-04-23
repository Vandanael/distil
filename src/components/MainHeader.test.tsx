import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LocaleProvider } from '@/lib/i18n/context'
import { MainHeader } from './MainHeader'

vi.mock('next/navigation', () => ({
  usePathname: () => '/feed',
}))

describe('MainHeader', () => {
  it('affiche le lien Se deconnecter', () => {
    render(
      <LocaleProvider>
        <MainHeader />
      </LocaleProvider>
    )
    expect(screen.getByText('Se déconnecter')).toBeTruthy()
  })

  it('pointe vers le server action signOut via un form', () => {
    render(
      <LocaleProvider>
        <MainHeader />
      </LocaleProvider>
    )
    const btn = screen.getByText('Se déconnecter')
    expect(btn.closest('form')).toBeTruthy()
  })
})