import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ArticleCard } from './ArticleCard'

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

  it('affiche le score masque par defaut', () => {
    render(<ArticleCard {...BASE_PROPS} />)
    const score = screen.getByTestId('score-abc-123')
    expect(score.className).toContain('opacity-0')
  })

  it('revele le score au hover', () => {
    render(<ArticleCard {...BASE_PROPS} />)
    const card = screen.getByTestId('article-card-abc-123')
    fireEvent.mouseEnter(card)
    const score = screen.getByTestId('score-abc-123')
    expect(score.className).toContain('opacity-100')
  })

  it('masque le score quand la souris quitte', () => {
    render(<ArticleCard {...BASE_PROPS} />)
    const card = screen.getByTestId('article-card-abc-123')
    fireEvent.mouseEnter(card)
    fireEvent.mouseLeave(card)
    const score = screen.getByTestId('score-abc-123')
    expect(score.className).toContain('opacity-0')
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
})
