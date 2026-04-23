import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { ArticleCard } from './ArticleCard'
import { DismissProvider } from './DismissContext'
import { toast } from 'sonner'
import { markNotInterested, addToRead } from '@/app/(main)/article/[id]/actions'

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

vi.mock('@/app/(main)/article/[id]/actions', () => ({
  markNotInterested: vi.fn().mockResolvedValue(undefined),
  addToRead: vi.fn().mockResolvedValue(undefined),
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

beforeEach(() => {
  vi.mocked(toast.success).mockClear()
  vi.mocked(toast.error).mockClear()
  vi.mocked(markNotInterested).mockClear()
  vi.mocked(addToRead).mockClear()
})

afterEach(() => {
  vi.useRealTimers()
})

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
    expect(screen.getByText(/4 min/)).toBeTruthy()
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

  it('lien pointe vers /article/:id avec marqueur from=feed', () => {
    renderCard(BASE_PROPS)
    const link = screen.getByTestId('article-card-link-abc-123')
    expect(link.getAttribute('href')).toBe('/article/abc-123?from=feed')
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

  it('bouton Pas intéressé présent avec le bon aria-label', () => {
    renderCard(BASE_PROPS)
    const btn = screen.getByTestId('dismiss-abc-123')
    expect(btn).toBeTruthy()
    expect(btn.getAttribute('aria-label')).toBe('Pas intéressé pour cet article')
  })

  it('le tag est cliquable quand fourni', () => {
    renderCard({ ...BASE_PROPS, score: 82 })
    expect(screen.getByTestId('tag-abc-123')).toBeTruthy()
  })

  it('cache la justification par defaut et l affiche via toggle Pourquoi', () => {
    renderCard({ ...BASE_PROPS, justification: 'Correspond a votre profil ML.' })
    expect(screen.queryByTestId('justification-inline-abc-123')).toBeNull()
    fireEvent.click(screen.getByTestId('toggle-details-abc-123'))
    expect(screen.getByTestId('justification-inline-abc-123')).toBeTruthy()
  })

  it('bouton Pas intéressé affiche le toast avec le bon message', () => {
    renderCard(BASE_PROPS)
    fireEvent.click(screen.getByTestId('dismiss-abc-123'))
    expect(vi.mocked(toast.success)).toHaveBeenCalledWith(
      'Pas intéressé',
      expect.objectContaining({ duration: 4000 })
    )
  })

  it('undo bouton Pas intéressé annule la persistence markNotInterested', () => {
    vi.useFakeTimers()
    renderCard(BASE_PROPS)

    fireEvent.click(screen.getByTestId('dismiss-abc-123'))

    const [, opts] = vi.mocked(toast.success).mock.calls[0] as [
      string,
      { action?: { onClick: () => void } },
    ]
    act(() => {
      opts?.action?.onClick()
    })

    act(() => {
      vi.advanceTimersByTime(4000)
    })

    expect(vi.mocked(markNotInterested)).not.toHaveBeenCalled()
  })

  it('swipe gauche affiche le toast Pas intéressé', () => {
    vi.useFakeTimers()
    renderCard(BASE_PROPS)
    const card = screen.getByTestId('article-card-abc-123')

    act(() => {
      fireEvent.pointerDown(card, { clientX: 100, clientY: 200, button: 0, pointerId: 1 })
      fireEvent.pointerMove(card, { clientX: 0, clientY: 200, pointerId: 1 })
      fireEvent.pointerUp(card, { clientX: 0, clientY: 200, pointerId: 1 })
    })

    // SLIDE_OUT_DURATION = 200ms avant le callback
    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(vi.mocked(toast.success)).toHaveBeenCalledWith(
      'Pas intéressé',
      expect.objectContaining({ duration: 4000 })
    )
  })

  it('swipe droit affiche le toast Ajouté à À lire', () => {
    vi.useFakeTimers()
    renderCard(BASE_PROPS)
    const card = screen.getByTestId('article-card-abc-123')

    act(() => {
      fireEvent.pointerDown(card, { clientX: 0, clientY: 200, button: 0, pointerId: 1 })
      fireEvent.pointerMove(card, { clientX: 100, clientY: 200, pointerId: 1 })
      fireEvent.pointerUp(card, { clientX: 100, clientY: 200, pointerId: 1 })
    })

    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(vi.mocked(toast.success)).toHaveBeenCalledWith(
      'Ajouté à À lire',
      expect.objectContaining({ duration: 4000 })
    )
  })

  it('undo swipe droit annule la persistence addToRead', () => {
    vi.useFakeTimers()
    renderCard(BASE_PROPS)
    const card = screen.getByTestId('article-card-abc-123')

    act(() => {
      fireEvent.pointerDown(card, { clientX: 0, clientY: 200, button: 0, pointerId: 1 })
      fireEvent.pointerMove(card, { clientX: 100, clientY: 200, pointerId: 1 })
      fireEvent.pointerUp(card, { clientX: 100, clientY: 200, pointerId: 1 })
    })

    act(() => {
      vi.advanceTimersByTime(200)
    })

    const [, opts] = vi.mocked(toast.success).mock.calls[0] as [
      string,
      { action?: { onClick: () => void } },
    ]
    act(() => {
      opts?.action?.onClick()
    })

    act(() => {
      vi.advanceTimersByTime(4000)
    })

    expect(vi.mocked(addToRead)).not.toHaveBeenCalled()
  })

  it('affiche le badge carry-over "Hier" si carryOverCount=1 et scoredAt hier', () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    renderCard({ ...BASE_PROPS, carryOverCount: 1, scoredAt: yesterday })
    expect(screen.getByTestId('carry-over-badge-abc-123')).toBeTruthy()
    expect(screen.getByTestId('carry-over-badge-abc-123').textContent).toContain('Hier')
  })

  it('ne pas afficher le badge carry-over si carryOverCount=0', () => {
    renderCard({ ...BASE_PROPS, carryOverCount: 0 })
    expect(screen.queryByTestId('carry-over-badge-abc-123')).toBeNull()
  })

  it('bouton A lire present et appelle addToRead au clic', () => {
    renderCard(BASE_PROPS)
    const btn = screen.getByTestId('add-to-read-abc-123')
    expect(btn).toBeTruthy()
    expect(btn.getAttribute('aria-label')).toBe('Ajouter à la liste de lecture')
  })
})
