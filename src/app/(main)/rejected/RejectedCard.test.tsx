import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RejectedCard } from './RejectedCard'

vi.mock('../actions', () => ({
  keepArticle: vi.fn().mockResolvedValue(undefined),
}))

const BASE_PROPS = {
  id: 'rej-001',
  title: 'Article hors sujet',
  siteName: 'spam.io',
  rejectionReason: 'Sujet sans rapport avec le profil',
  url: 'https://spam.io/article',
}

describe('RejectedCard', () => {
  it('affiche le titre', () => {
    render(<RejectedCard {...BASE_PROPS} />)
    expect(screen.getByText('Article hors sujet')).toBeTruthy()
  })

  it('affiche la raison de rejet', () => {
    render(<RejectedCard {...BASE_PROPS} />)
    expect(screen.getByTestId('rejection-reason-rej-001')).toBeTruthy()
    expect(screen.getByText('Sujet sans rapport avec le profil')).toBeTruthy()
  })

  it('affiche le bouton Garder quand meme', () => {
    render(<RejectedCard {...BASE_PROPS} />)
    expect(screen.getByTestId('keep-anyway-rej-001')).toBeTruthy()
  })

  it('bouton desactive pendant la transition', async () => {
    const { keepArticle } = await import('../actions')
    vi.mocked(keepArticle).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    )
    render(<RejectedCard {...BASE_PROPS} />)
    const btn = screen.getByTestId('keep-anyway-rej-001')
    fireEvent.click(btn)
    expect(btn).toHaveProperty('disabled', true)
  })

  it('affiche Sans titre si title null', () => {
    render(<RejectedCard {...BASE_PROPS} title={null} />)
    expect(screen.getByText('Sans titre')).toBeTruthy()
  })

  it('lien source ouvre url', () => {
    render(<RejectedCard {...BASE_PROPS} />)
    const link = screen.getByText('Article hors sujet')
    expect(link.getAttribute('href')).toBe('https://spam.io/article')
  })
})
