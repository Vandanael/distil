import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ArticleCard } from './ArticleCard'

vi.mock('../../article/[id]/actions', () => ({
  dismissArticle: vi.fn().mockResolvedValue(undefined),
}))

const BASE_PROPS = {
  id: 'abc-123',
  title: 'Mon article de test',
  siteName: 'example.com',
  excerpt: 'Un extrait court.',
  readingTimeMinutes: 4,
  score: 82,
  isSerendipity: false,
  origin: 'agent',
  scoredAt: null,
  wordCount: 850,
}

describe('ArticleCard', () => {
  it('affiche le titre', () => {
    render(<ArticleCard {...BASE_PROPS} />)
    expect(screen.getByText('Mon article de test')).toBeTruthy()
  })

  it('affiche le site name', () => {
    render(<ArticleCard {...BASE_PROPS} />)
    expect(screen.getByText('example.com')).toBeTruthy()
  })

  it('affiche le temps de lecture', () => {
    render(<ArticleCard {...BASE_PROPS} />)
    expect(screen.getByText('4 min')).toBeTruthy()
  })

  it('affiche le badge Decouverte si serendipity', () => {
    render(<ArticleCard {...BASE_PROPS} isSerendipity={true} />)
    expect(screen.getByTestId('serendipity-badge-abc-123')).toBeTruthy()
  })

  it('ne pas afficher le badge si pas serendipity', () => {
    render(<ArticleCard {...BASE_PROPS} isSerendipity={false} />)
    expect(screen.queryByTestId('serendipity-badge-abc-123')).toBeNull()
  })

  it('affiche Sans titre si title null', () => {
    render(<ArticleCard {...BASE_PROPS} title={null} />)
    expect(screen.getByText('Sans titre')).toBeTruthy()
  })

  it('lien pointe vers /article/:id', () => {
    render(<ArticleCard {...BASE_PROPS} />)
    const link = screen.getByTestId('article-card-abc-123')
    expect(link.getAttribute('href')).toBe('/article/abc-123')
  })

  it('affiche le badge Paywall si wordCount null', () => {
    render(<ArticleCard {...BASE_PROPS} wordCount={null} />)
    expect(screen.getByTestId('paywall-badge-abc-123')).toBeTruthy()
  })

  it('affiche le badge Paywall si wordCount zero', () => {
    render(<ArticleCard {...BASE_PROPS} wordCount={0} />)
    expect(screen.getByTestId('paywall-badge-abc-123')).toBeTruthy()
  })

  it('ne pas afficher le badge Paywall si wordCount positif', () => {
    render(<ArticleCard {...BASE_PROPS} wordCount={850} />)
    expect(screen.queryByTestId('paywall-badge-abc-123')).toBeNull()
  })

  it('affiche le bouton dismiss toujours present et tappable', () => {
    render(<ArticleCard {...BASE_PROPS} />)
    const btn = screen.getByTestId('dismiss-abc-123')
    expect(btn).toBeTruthy()
    expect(btn.getAttribute('aria-label')).toBe('Masquer cet article')
  })

  it('le score est toujours visible quand fourni', () => {
    render(<ArticleCard {...BASE_PROPS} score={82} />)
    expect(screen.getByTestId('score-abc-123')).toBeTruthy()
  })
})
