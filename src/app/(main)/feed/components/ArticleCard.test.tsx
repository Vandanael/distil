import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ArticleCard } from './ArticleCard'
import { DismissProvider } from './DismissContext'

vi.mock('@/app/(main)/article/[id]/actions', () => ({
  dismissArticle: vi.fn().mockResolvedValue(undefined),
}))

function renderCard(props: React.ComponentProps<typeof ArticleCard>) {
  return render(
    <DismissProvider>
      <ArticleCard {...props} />
    </DismissProvider>
  )
}

const BASE_PROPS = {
  id: 'abc-123',
  title: 'Mon article de test',
  siteName: 'example.com',
  excerpt: 'Un extrait court.',
  readingTimeMinutes: 4,
  score: 82,
  justification: null,
  isSerendipity: false,
  origin: 'agent',
  scoredAt: null,
  wordCount: 850,
  ogImageUrl: null,
}

describe('ArticleCard', () => {
  it('affiche le titre', () => {
    renderCard(BASE_PROPS)
    expect(screen.getByText('Mon article de test')).toBeTruthy()
  })

  it('affiche le site name', () => {
    renderCard(BASE_PROPS)
    expect(screen.getByText('example.com')).toBeTruthy()
  })

  it('affiche le temps de lecture', () => {
    renderCard(BASE_PROPS)
    expect(screen.getByText('4 min')).toBeTruthy()
  })

  it('affiche le badge Decouverte si serendipity', () => {
    renderCard({ ...BASE_PROPS, isSerendipity: true })
    expect(screen.getByTestId('serendipity-badge-abc-123')).toBeTruthy()
  })

  it('ne pas afficher le badge si pas serendipity', () => {
    renderCard({ ...BASE_PROPS, isSerendipity: false })
    expect(screen.queryByTestId('serendipity-badge-abc-123')).toBeNull()
  })

  it('affiche Sans titre si title null', () => {
    renderCard({ ...BASE_PROPS, title: null })
    expect(screen.getByText('Sans titre')).toBeTruthy()
  })

  it('lien pointe vers /article/:id', () => {
    renderCard(BASE_PROPS)
    const link = screen.getByTestId('article-card-abc-123')
    expect(link.getAttribute('href')).toBe('/article/abc-123')
  })

  it('ne pas afficher le badge Paywall si wordCount null (non parse)', () => {
    renderCard({ ...BASE_PROPS, wordCount: null })
    expect(screen.queryByTestId('paywall-badge-abc-123')).toBeNull()
  })

  it('affiche le badge Paywall si wordCount zero', () => {
    renderCard({ ...BASE_PROPS, wordCount: 0 })
    expect(screen.getByTestId('paywall-badge-abc-123')).toBeTruthy()
  })

  it('ne pas afficher le badge Paywall si wordCount positif', () => {
    renderCard({ ...BASE_PROPS, wordCount: 850 })
    expect(screen.queryByTestId('paywall-badge-abc-123')).toBeNull()
  })

  it('affiche le bouton dismiss toujours present et tappable', () => {
    renderCard(BASE_PROPS)
    const btn = screen.getByTestId('dismiss-abc-123')
    expect(btn).toBeTruthy()
    expect(btn.getAttribute('aria-label')).toBe('Masquer cet article')
  })

  it('le score est toujours visible quand fourni', () => {
    renderCard({ ...BASE_PROPS, score: 82 })
    expect(screen.getByTestId('score-abc-123')).toBeTruthy()
  })
})
