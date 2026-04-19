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
  publishedAt: null,
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

  it('affiche le tag Decouverte si serendipity', () => {
    renderCard({ ...BASE_PROPS, isSerendipity: true })
    const tag = screen.getByTestId('tag-abc-123')
    expect(tag.textContent).toContain('Découverte')
  })

  it('affiche le score en pourcentage si score >= 60', () => {
    renderCard({ ...BASE_PROPS, score: 85 })
    const scoreEl = screen.getByTestId('score-abc-123')
    expect(scoreEl.textContent).toContain('85')
  })

  it('pas de label textuel pour un match sans serendipity (juste le score)', () => {
    renderCard({ ...BASE_PROPS, score: 70 })
    const tag = screen.getByTestId('tag-abc-123')
    // Tag toujours present pour l a11y (sr-only avec le score) mais pas de "Match" visible
    expect(tag.textContent).not.toContain('Match')
  })

  it('n affiche pas de tag si score sous 60 sans serendipity', () => {
    renderCard({ ...BASE_PROPS, score: 50, isSerendipity: false })
    expect(screen.queryByTestId('tag-abc-123')).toBeNull()
  })

  it('affiche Sans titre si title null', () => {
    renderCard({ ...BASE_PROPS, title: null })
    expect(screen.getByText('Sans titre')).toBeTruthy()
  })

  it('lien pointe vers /article/:id', () => {
    renderCard(BASE_PROPS)
    const link = screen.getByTestId('article-card-link-abc-123')
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

  it('le tag est cliquable quand fourni', () => {
    renderCard({ ...BASE_PROPS, score: 82 })
    expect(screen.getByTestId('tag-abc-123')).toBeTruthy()
  })

  it('affiche la justification inline sous l excerpt', () => {
    renderCard({ ...BASE_PROPS, justification: 'Correspond a votre profil ML.' })
    expect(screen.getByTestId('justification-inline-abc-123')).toBeTruthy()
  })
})
