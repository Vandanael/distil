import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useState } from 'react'
import { URLList, normalizeUrl } from './URLList'

function Wrapper({
  initial = [] as string[],
  onChange,
  maxUrls,
  showCounter,
}: {
  initial?: string[]
  onChange?: (t: string[]) => void
  maxUrls?: number
  showCounter?: boolean
}) {
  const [urls, setUrls] = useState<string[]>(initial)
  return (
    <URLList
      value={urls}
      onChange={(next) => {
        setUrls(next)
        onChange?.(next)
      }}
      maxUrls={maxUrls}
      showCounter={showCounter}
    />
  )
}

describe('normalizeUrl', () => {
  it('auto-préfixe https:// si schéma manquant', () => {
    expect(normalizeUrl('lemonde.fr')).toBe('https://lemonde.fr')
  })

  it('conserve http:// existant', () => {
    expect(normalizeUrl('http://example.com')).toBe('http://example.com')
  })

  it('conserve https:// existant', () => {
    expect(normalizeUrl('https://example.com/feed')).toBe('https://example.com/feed')
  })

  it('trim les espaces', () => {
    expect(normalizeUrl('  example.com  ')).toBe('https://example.com')
  })

  it('rejette string vide', () => {
    expect(normalizeUrl('')).toBeNull()
    expect(normalizeUrl('   ')).toBeNull()
  })

  it('rejette si pas de point dans hostname', () => {
    expect(normalizeUrl('localhost')).toBeNull()
  })

  it('rejette URL malformée', () => {
    expect(normalizeUrl('http://')).toBeNull()
  })
})

describe('URLList', () => {
  it('ajoute une URL sur Enter avec auto-préfixe', () => {
    const onChange = vi.fn()
    render(<Wrapper onChange={onChange} />)
    const input = screen.getByPlaceholderText('lemonde.fr, paulgraham.com...')
    fireEvent.change(input, { target: { value: 'example.com' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onChange).toHaveBeenLastCalledWith(['https://example.com'])
  })

  it('ajoute une URL via bouton Ajouter', () => {
    const onChange = vi.fn()
    render(<Wrapper onChange={onChange} />)
    const input = screen.getByPlaceholderText('lemonde.fr, paulgraham.com...')
    fireEvent.change(input, { target: { value: 'example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter' }))
    expect(onChange).toHaveBeenLastCalledWith(['https://example.com'])
  })

  it('affiche une erreur pour URL invalide', () => {
    const onChange = vi.fn()
    render(<Wrapper onChange={onChange} />)
    const input = screen.getByPlaceholderText('lemonde.fr, paulgraham.com...')
    fireEvent.change(input, { target: { value: 'localhost' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByRole('alert').textContent).toContain('URL invalide')
  })

  it('ignore les doublons après normalisation', () => {
    const onChange = vi.fn()
    render(<Wrapper initial={['https://example.com']} onChange={onChange} />)
    const input = screen.getByPlaceholderText('lemonde.fr, paulgraham.com...')
    fireEvent.change(input, { target: { value: 'example.com' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onChange).not.toHaveBeenCalled()
  })

  it('supprime via bouton croix', () => {
    const onChange = vi.fn()
    render(<Wrapper initial={['https://a.com', 'https://b.com']} onChange={onChange} />)
    fireEvent.click(screen.getByLabelText('Supprimer https://a.com'))
    expect(onChange).toHaveBeenLastCalledWith(['https://b.com'])
  })

  it('affiche le compteur si showCounter + maxUrls', () => {
    render(<Wrapper initial={['https://a.com']} maxUrls={50} showCounter />)
    expect(screen.getByText('1 sur 50')).toBeTruthy()
  })

  it('bloque quand maxUrls atteint', () => {
    const onChange = vi.fn()
    render(<Wrapper initial={['https://a.com']} maxUrls={1} onChange={onChange} />)
    const input = screen.getByPlaceholderText('lemonde.fr, paulgraham.com...') as HTMLInputElement
    expect(input.disabled).toBe(true)
  })
})
