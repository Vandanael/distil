'use client'

import { useEffect, useRef } from 'react'

// Declenche onReached une seule fois quand l'utilisateur a scrolle jusqu'a
// threshold (0-1) de la hauteur du contenu cible. Sentinelle positionnee dans
// le parent de contentRef, observee via IntersectionObserver.
export function useScrollEndDetection(
  contentRef: React.RefObject<HTMLElement | null>,
  onReached: () => void,
  threshold = 0.85
): void {
  const firedRef = useRef(false)
  const callbackRef = useRef(onReached)

  useEffect(() => {
    callbackRef.current = onReached
  }, [onReached])

  useEffect(() => {
    const content = contentRef.current
    if (!content) return

    const parent = content.parentElement
    if (!parent) return

    // Le parent doit etre en position relative pour ancrer la sentinelle.
    const previousPosition = parent.style.position
    if (!previousPosition || previousPosition === 'static') {
      parent.style.position = 'relative'
    }

    const sentinel = document.createElement('div')
    sentinel.setAttribute('aria-hidden', 'true')
    sentinel.setAttribute('data-testid', 'scroll-end-sentinel')
    sentinel.style.position = 'absolute'
    sentinel.style.left = '0'
    sentinel.style.width = '1px'
    sentinel.style.height = '1px'
    sentinel.style.pointerEvents = 'none'

    function positionSentinel() {
      const el = contentRef.current
      if (!el) return
      const top = el.offsetTop + el.scrollHeight * threshold
      sentinel.style.top = `${Math.floor(top)}px`
    }

    parent.appendChild(sentinel)
    positionSentinel()

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !firedRef.current) {
            firedRef.current = true
            callbackRef.current()
            observer.disconnect()
          }
        }
      },
      { threshold: 0 }
    )
    observer.observe(sentinel)

    // Replace la sentinelle si le contenu redimensionne (images chargees, fonts).
    const resize = new ResizeObserver(positionSentinel)
    resize.observe(content)

    return () => {
      observer.disconnect()
      resize.disconnect()
      sentinel.remove()
      if (!previousPosition || previousPosition === 'static') {
        parent.style.position = previousPosition
      }
    }
  }, [contentRef, threshold])
}
