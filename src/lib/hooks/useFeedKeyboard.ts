'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

type UseFeedKeyboardOptions = {
  onNotInterested: (articleId: string) => void
  onAddToRead: (articleId: string) => void
  onNavigate: (articleId: string) => void
}

export function useFeedKeyboard({
  onNotInterested,
  onAddToRead,
  onNavigate,
}: UseFeedKeyboardOptions) {
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const prevFocusedRef = useRef<Element | null>(null)

  const getCards = useCallback(() => {
    return document.querySelectorAll<HTMLElement>('[data-article-card]')
  }, [])

  // Appliquer/retirer le focus visuel
  useEffect(() => {
    if (prevFocusedRef.current) {
      prevFocusedRef.current.removeAttribute('data-keyboard-focus')
    }

    const cards = getCards()
    if (focusedIndex >= 0 && focusedIndex < cards.length) {
      const card = cards[focusedIndex]
      card.setAttribute('data-keyboard-focus', '')
      card.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      prevFocusedRef.current = card
    } else {
      prevFocusedRef.current = null
    }
  }, [focusedIndex, getCards])

  // Reset focus visuel sur clic souris
  useEffect(() => {
    function onMouseDown() {
      if (focusedIndex >= 0) setFocusedIndex(-1)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [focusedIndex])

  // Listener clavier
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Ignorer si focus dans un champ texte
      const tag = (document.activeElement?.tagName ?? '').toLowerCase()
      if (
        tag === 'input' ||
        tag === 'textarea' ||
        document.activeElement?.hasAttribute('contenteditable')
      ) {
        return
      }

      const cards = getCards()
      const count = cards.length
      if (count === 0) return

      switch (e.key) {
        case 'j':
        case 'ArrowDown': {
          e.preventDefault()
          setFocusedIndex((prev) => Math.min(prev + 1, count - 1))
          break
        }
        case 'k':
        case 'ArrowUp': {
          e.preventDefault()
          setFocusedIndex((prev) => Math.max(prev - 1, 0))
          break
        }
        case 'Enter': {
          if (focusedIndex < 0 || focusedIndex >= count) return
          const articleId = cards[focusedIndex].getAttribute('data-article-id')
          if (articleId) {
            e.preventDefault()
            onNavigate(articleId)
          }
          break
        }
        case 'd':
        case 'ArrowLeft': {
          if (focusedIndex < 0 || focusedIndex >= count) return
          const articleId = cards[focusedIndex].getAttribute('data-article-id')
          if (articleId) {
            e.preventDefault()
            onNotInterested(articleId)
            setFocusedIndex((prev) => Math.min(prev, count - 2))
          }
          break
        }
        case 'ArrowRight': {
          if (focusedIndex < 0 || focusedIndex >= count) return
          const articleId = cards[focusedIndex].getAttribute('data-article-id')
          if (articleId) {
            e.preventDefault()
            onAddToRead(articleId)
            setFocusedIndex((prev) => Math.min(prev, count - 2))
          }
          break
        }
        case 'Escape': {
          setFocusedIndex(-1)
          break
        }
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [focusedIndex, getCards, onNotInterested, onAddToRead, onNavigate])

  return { focusedIndex }
}
