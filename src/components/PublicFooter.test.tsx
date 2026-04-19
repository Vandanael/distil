import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PublicFooter } from './PublicFooter'

describe('PublicFooter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2027-08-14T10:00:00Z'))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('affiche l annee courante dynamique dans le copyright', () => {
    render(<PublicFooter />)
    expect(
      screen.getByText(
        (_, el) =>
          el?.tagName === 'P' &&
          el.textContent?.replace(/\s+/g, ' ').trim() ===
            '© 2026-2027 Distil. Tous droits réservés.'
      )
    ).toBeTruthy()
  })

  it('affiche les labels FR par defaut', () => {
    render(<PublicFooter />)
    expect(screen.getByText('À propos')).toBeTruthy()
  })

  it('bascule en EN via la prop lang', () => {
    render(<PublicFooter lang="en" />)
    expect(screen.getByText('About')).toBeTruthy()
  })

  it('pointe le lien vers /about', () => {
    render(<PublicFooter />)
    const about = screen.getByText('À propos').closest('a')
    expect(about?.getAttribute('href')).toBe('/about')
  })
})
