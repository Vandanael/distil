import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ScoringPanel } from './ScoringPanel'

describe('ScoringPanel', () => {
  it('affiche le score', () => {
    render(<ScoringPanel score={75} justification={null} isSerendipity={false} />)
    expect(screen.getByText('75')).toBeTruthy()
  })

  it('affiche la justification', () => {
    render(
      <ScoringPanel
        score={60}
        justification="Article pertinent sur le machine learning."
        isSerendipity={false}
      />
    )
    expect(screen.getByTestId('scoring-justification').textContent).toContain('machine learning')
  })

  it('n affiche pas la justification si null', () => {
    render(<ScoringPanel score={60} justification={null} isSerendipity={false} />)
    expect(screen.queryByTestId('scoring-justification')).toBeNull()
  })

  it('affiche le badge Decouverte si is_serendipity true', () => {
    render(<ScoringPanel score={45} justification={null} isSerendipity={true} />)
    expect(screen.getByTestId('serendipity-badge')).toBeTruthy()
  })

  it('n affiche pas le badge si is_serendipity false', () => {
    render(<ScoringPanel score={80} justification={null} isSerendipity={false} />)
    expect(screen.queryByTestId('serendipity-badge')).toBeNull()
  })

  it('le panneau est present dans le DOM', () => {
    render(<ScoringPanel score={55} justification="Test." isSerendipity={false} />)
    expect(screen.getByTestId('scoring-panel')).toBeTruthy()
  })
})
