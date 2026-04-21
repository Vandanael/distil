import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BulkPaste, splitBulk } from './BulkPaste'

describe('splitBulk', () => {
  it('split sur sauts de ligne', () => {
    expect(splitBulk('a.com\nb.com\nc.com')).toEqual(['a.com', 'b.com', 'c.com'])
  })

  it('split sur virgules', () => {
    expect(splitBulk('a.com, b.com, c.com')).toEqual(['a.com', 'b.com', 'c.com'])
  })

  it('split sur mix séparateurs', () => {
    expect(splitBulk('a.com\nb.com, c.com;d.com e.com')).toEqual([
      'a.com',
      'b.com',
      'c.com',
      'd.com',
      'e.com',
    ])
  })

  it('retourne tableau vide pour string vide', () => {
    expect(splitBulk('')).toEqual([])
    expect(splitBulk('   \n  ')).toEqual([])
  })
})

describe('BulkPaste', () => {
  it('est replié par défaut', () => {
    render(<BulkPaste onParse={() => {}} />)
    expect(screen.getByText('Ajouter plusieurs à la fois')).toBeTruthy()
    expect(screen.queryByRole('textbox')).toBeNull()
  })

  it('ouvre la textarea au clic sur toggle', () => {
    render(<BulkPaste onParse={() => {}} />)
    fireEvent.click(screen.getByText('Ajouter plusieurs à la fois'))
    expect(screen.getByRole('textbox')).toBeTruthy()
  })

  it('parse URLs valides et ignore invalides', () => {
    const onParse = vi.fn()
    render(<BulkPaste onParse={onParse} />)
    fireEvent.click(screen.getByText('Ajouter plusieurs à la fois'))
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'example.com\nlocalhost\ngood.org' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter à ma liste' }))
    expect(onParse).toHaveBeenCalledWith(['https://example.com', 'https://good.org'])
  })

  it('affiche feedback avec compte ajoutés + ignorés', () => {
    render(<BulkPaste onParse={() => {}} />)
    fireEvent.click(screen.getByText('Ajouter plusieurs à la fois'))
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'example.com\nlocalhost' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter à ma liste' }))
    expect(screen.getByText(/1 URL\(s\) ajoutée\(s\)/)).toBeTruthy()
    expect(screen.getByText(/1 ignorée\(s\)/)).toBeTruthy()
  })

  it('affiche erreur si aucune URL valide', () => {
    const onParse = vi.fn()
    render(<BulkPaste onParse={onParse} />)
    fireEvent.click(screen.getByText('Ajouter plusieurs à la fois'))
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'localhost\n???' } })
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter à ma liste' }))
    expect(onParse).not.toHaveBeenCalled()
    expect(screen.getByText(/Aucune URL valide/)).toBeTruthy()
  })

  it('dédoublonne dans le blob collé', () => {
    const onParse = vi.fn()
    render(<BulkPaste onParse={onParse} />)
    fireEvent.click(screen.getByText('Ajouter plusieurs à la fois'))
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'example.com\nexample.com\nother.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter à ma liste' }))
    expect(onParse).toHaveBeenCalledWith(['https://example.com', 'https://other.com'])
  })
})
