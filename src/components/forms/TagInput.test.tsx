import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useState } from 'react'
import { TagInput } from './TagInput'

function Wrapper({
  initial = [] as string[],
  onChange,
}: {
  initial?: string[]
  onChange?: (t: string[]) => void
}) {
  const [tags, setTags] = useState<string[]>(initial)
  return (
    <TagInput
      value={tags}
      onChange={(next) => {
        setTags(next)
        onChange?.(next)
      }}
      data-testid="tag-input"
    />
  )
}

describe('TagInput', () => {
  it('ajoute un tag sur Enter', () => {
    const onChange = vi.fn()
    render(<Wrapper onChange={onChange} />)
    const input = screen.getByPlaceholderText('Ajouter un mot-clé...')
    fireEvent.change(input, { target: { value: 'produit' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onChange).toHaveBeenLastCalledWith(['produit'])
  })

  it('ajoute un tag sur virgule', () => {
    const onChange = vi.fn()
    render(<Wrapper onChange={onChange} />)
    const input = screen.getByPlaceholderText('Ajouter un mot-clé...')
    fireEvent.change(input, { target: { value: 'veille' } })
    fireEvent.keyDown(input, { key: ',' })
    expect(onChange).toHaveBeenLastCalledWith(['veille'])
  })

  it('trim les espaces', () => {
    const onChange = vi.fn()
    render(<Wrapper onChange={onChange} />)
    const input = screen.getByPlaceholderText('Ajouter un mot-clé...')
    fireEvent.change(input, { target: { value: '  design  ' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onChange).toHaveBeenLastCalledWith(['design'])
  })

  it('ignore les doublons', () => {
    const onChange = vi.fn()
    render(<Wrapper initial={['produit']} onChange={onChange} />)
    const input = screen.getByPlaceholderText('Ajouter un mot-clé...')
    fireEvent.change(input, { target: { value: 'produit' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onChange).not.toHaveBeenCalled()
  })

  it('supprime via bouton croix', () => {
    const onChange = vi.fn()
    render(<Wrapper initial={['produit', 'design']} onChange={onChange} />)
    const btn = screen.getByLabelText('Supprimer produit')
    fireEvent.click(btn)
    expect(onChange).toHaveBeenLastCalledWith(['design'])
  })

  it('supprime le dernier tag avec Backspace quand input vide', () => {
    const onChange = vi.fn()
    render(<Wrapper initial={['a', 'b']} onChange={onChange} />)
    const input = screen.getByPlaceholderText('Ajouter un mot-clé...')
    fireEvent.keyDown(input, { key: 'Backspace' })
    expect(onChange).toHaveBeenLastCalledWith(['a'])
  })

  it('ne supprime pas avec Backspace si input non vide', () => {
    const onChange = vi.fn()
    render(<Wrapper initial={['a']} onChange={onChange} />)
    const input = screen.getByPlaceholderText('Ajouter un mot-clé...')
    fireEvent.change(input, { target: { value: 'x' } })
    fireEvent.keyDown(input, { key: 'Backspace' })
    expect(onChange).not.toHaveBeenCalled()
  })

  it('respecte maxTags', () => {
    const onChange = vi.fn()
    function Limited() {
      const [tags, setTags] = useState<string[]>(['a', 'b'])
      return (
        <TagInput
          value={tags}
          onChange={(t) => {
            setTags(t)
            onChange(t)
          }}
          maxTags={2}
        />
      )
    }
    render(<Limited />)
    const input = screen.getByPlaceholderText('Ajouter un mot-clé...')
    fireEvent.change(input, { target: { value: 'c' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onChange).not.toHaveBeenCalled()
  })
})
