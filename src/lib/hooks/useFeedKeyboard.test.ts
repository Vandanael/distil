import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFeedKeyboard } from './useFeedKeyboard'

function createMockCards(ids: string[]) {
  const container = document.createElement('div')
  ids.forEach((id) => {
    const card = document.createElement('a')
    card.setAttribute('data-article-card', '')
    card.setAttribute('data-article-id', id)
    card.scrollIntoView = vi.fn()
    container.appendChild(card)
  })
  document.body.appendChild(container)
  return container
}

function pressKey(key: string) {
  act(() => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
  })
}

describe('useFeedKeyboard', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = createMockCards(['a1', 'a2', 'a3'])
  })

  afterEach(() => {
    document.body.removeChild(container)
  })

  it('j deplace le focus vers le bas', () => {
    const onDismiss = vi.fn()
    const onNavigate = vi.fn()
    renderHook(() => useFeedKeyboard({ onDismiss, onNavigate }))

    pressKey('j')

    const cards = document.querySelectorAll('[data-article-card]')
    expect(cards[0].hasAttribute('data-keyboard-focus')).toBe(true)
  })

  it('k deplace le focus vers le haut', () => {
    const onDismiss = vi.fn()
    const onNavigate = vi.fn()
    renderHook(() => useFeedKeyboard({ onDismiss, onNavigate }))

    pressKey('j')
    pressKey('j')
    pressKey('k')

    const cards = document.querySelectorAll('[data-article-card]')
    expect(cards[0].hasAttribute('data-keyboard-focus')).toBe(true)
    expect(cards[1].hasAttribute('data-keyboard-focus')).toBe(false)
  })

  it('Enter navigue vers l article focus', () => {
    const onDismiss = vi.fn()
    const onNavigate = vi.fn()
    renderHook(() => useFeedKeyboard({ onDismiss, onNavigate }))

    pressKey('j')
    pressKey('Enter')

    expect(onNavigate).toHaveBeenCalledWith('a1')
  })

  it('d appelle onDismiss avec le bon id', () => {
    const onDismiss = vi.fn()
    const onNavigate = vi.fn()
    renderHook(() => useFeedKeyboard({ onDismiss, onNavigate }))

    pressKey('j')
    pressKey('j')
    pressKey('d')

    expect(onDismiss).toHaveBeenCalledWith('a2')
  })

  it('Escape retire le focus', () => {
    const onDismiss = vi.fn()
    const onNavigate = vi.fn()
    renderHook(() => useFeedKeyboard({ onDismiss, onNavigate }))

    pressKey('j')
    pressKey('Escape')

    const cards = document.querySelectorAll('[data-article-card]')
    expect(cards[0].hasAttribute('data-keyboard-focus')).toBe(false)
  })

  it('ignore les touches quand focus dans un input', () => {
    const onDismiss = vi.fn()
    const onNavigate = vi.fn()
    renderHook(() => useFeedKeyboard({ onDismiss, onNavigate }))

    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()

    pressKey('j')
    pressKey('Enter')

    expect(onNavigate).not.toHaveBeenCalled()
    document.body.removeChild(input)
  })

  it('j ne depasse pas la derniere carte', () => {
    const onDismiss = vi.fn()
    const onNavigate = vi.fn()
    renderHook(() => useFeedKeyboard({ onDismiss, onNavigate }))

    pressKey('j')
    pressKey('j')
    pressKey('j')
    pressKey('j') // au-dela de 3 cartes
    pressKey('Enter')

    expect(onNavigate).toHaveBeenCalledWith('a3')
  })
})
