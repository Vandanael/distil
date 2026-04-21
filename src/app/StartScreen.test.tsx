import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StartScreen } from './StartScreen'

vi.mock('@/lib/i18n/context', () => ({
  useLocale: () => ({ locale: 'fr', t: {}, setLocale: () => {} }),
}))

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

vi.mock('@/components/PublicHeader', () => ({ PublicHeader: () => null }))
vi.mock('@/components/PublicFooter', () => ({ PublicFooter: () => null }))
vi.mock('@/components/ArticleRow', () => ({ ArticleRow: () => null }))
vi.mock('@/lib/demo-accounts', () => ({
  DEMO_ACCOUNTS: [],
  HOME_FEATURED_SLUGS: [],
}))

describe('StartScreen', () => {
  it("affiche l'encart Vos sources, notre méthode", () => {
    render(<StartScreen articles={[]} />)
    expect(screen.getByText('Vos sources, notre méthode.')).toBeTruthy()
  })

  it('affiche le mini-schéma des 4 actions via son aria-label', () => {
    render(<StartScreen articles={[]} />)
    expect(screen.getByRole('figure')).toBeTruthy()
  })

  it('affiche les 4 libellés du modèle dans le schéma', () => {
    render(<StartScreen articles={[]} />)
    expect(screen.getByText('Plus comme ça')).toBeTruthy()
    expect(screen.getByText('Pas intéressé')).toBeTruthy()
    expect(screen.getByText('À lire')).toBeTruthy()
    expect(screen.getByText('Lu')).toBeTruthy()
  })

  it("affiche la section méthode avec le titre 'Comment Distil trie'", () => {
    render(<StartScreen articles={[]} />)
    const heading = screen.getByRole('heading', { name: /comment distil trie/i })
    expect(heading).toBeTruthy()
  })
})
