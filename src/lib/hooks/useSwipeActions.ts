'use client'

import { useCallback, useRef, useState } from 'react'

type UseSwipeActionsOptions = {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  threshold?: number
  enabled?: boolean
}

type SwipeHandlers = {
  onPointerDown: (e: React.PointerEvent) => void
  onPointerMove: (e: React.PointerEvent) => void
  onPointerUp: (e: React.PointerEvent) => void
  onPointerCancel: (e: React.PointerEvent) => void
}

type SwipeDirection = 'left' | 'right' | null

type UseSwipeActionsReturn = {
  handlers: SwipeHandlers
  style: React.CSSProperties
  isSwiping: boolean
  direction: SwipeDirection
  progress: number
}

const DEAD_ZONE = 10
const ANGLE_RATIO = 1.5
const SLIDE_OUT_DURATION = 200

/**
 * Swipe horizontal directionnel inspire Gmail :
 * - gauche : onSwipeLeft (typiquement dismiss / supprimer)
 * - droite : onSwipeRight (typiquement archive / sauver)
 *
 * Expose aussi `direction` et `progress` (0-1) pour afficher l'action
 * en arriere-plan pendant le geste.
 */
export function useSwipeActions({
  onSwipeLeft,
  onSwipeRight,
  threshold = 80,
  enabled = true,
}: UseSwipeActionsOptions): UseSwipeActionsReturn {
  const [style, setStyle] = useState<React.CSSProperties>({})
  const [isSwiping, setIsSwiping] = useState(false)
  const [direction, setDirection] = useState<SwipeDirection>(null)
  const [progress, setProgress] = useState(0)

  const startX = useRef(0)
  const startY = useRef(0)
  const locked = useRef<'horizontal' | 'vertical' | null>(null)
  const active = useRef(false)
  const captured = useRef(false)
  const reducedMotion = useRef(
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  )

  const reset = useCallback(() => {
    locked.current = null
    active.current = false
    captured.current = false
    setIsSwiping(false)
    setDirection(null)
    setProgress(0)
    setStyle({})
  }, [])

  // Ne pas capturer le pointer ici : un simple clic ne doit pas intercepter
  // le pointerup, sinon le click natif sur les enfants (Link, bouton Masquer)
  // ne se dispatche pas. La capture est differee a onPointerMove, quand on a
  // detecte un vrai swipe horizontal.
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!enabled || e.button !== 0) return
      startX.current = e.clientX
      startY.current = e.clientY
      locked.current = null
      active.current = true
      captured.current = false
    },
    [enabled]
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!active.current) return

      const deltaX = e.clientX - startX.current
      const deltaY = e.clientY - startY.current
      const absDx = Math.abs(deltaX)
      const absDy = Math.abs(deltaY)

      if (!locked.current) {
        if (absDx < DEAD_ZONE && absDy < DEAD_ZONE) return
        if (absDx > absDy * ANGLE_RATIO) {
          locked.current = 'horizontal'
          // Capture une fois le swipe horizontal confirme : on garde les
          // pointermove/up meme si le doigt sort de la card, sans bloquer
          // les clics simples (cas ou locked reste null).
          const el = e.currentTarget as HTMLElement
          try {
            el.setPointerCapture(e.pointerId)
            captured.current = true
          } catch {
            // setPointerCapture peut throw si le pointer n'est plus actif
          }
          setIsSwiping(true)
        } else {
          locked.current = 'vertical'
          return
        }
      }

      if (locked.current !== 'horizontal') return

      e.preventDefault()

      // Si la direction ne fournit pas de callback, on limite le deplacement
      // a un effet de "rebond" leger pour signaler que rien ne va se passer.
      const dir: SwipeDirection = deltaX < 0 ? 'left' : 'right'
      const hasAction = dir === 'left' ? Boolean(onSwipeLeft) : Boolean(onSwipeRight)
      const effectiveDelta = hasAction ? deltaX : deltaX * 0.15

      setDirection(dir)
      setProgress(Math.min(1, absDx / threshold))

      const opacity = Math.max(0.3, 1 - absDx / 300)
      setStyle({
        transform: `translateX(${effectiveDelta}px)`,
        opacity,
        transition: 'none',
        willChange: 'transform, opacity',
      })
    },
    [onSwipeLeft, onSwipeRight, threshold]
  )

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!active.current) return
      if (captured.current) {
        const el = e.currentTarget as HTMLElement
        try {
          el.releasePointerCapture(e.pointerId)
        } catch {
          // no-op : pointer deja relache
        }
      }

      if (locked.current !== 'horizontal') {
        reset()
        return
      }

      e.preventDefault()

      const deltaX = e.clientX - startX.current
      const dir: SwipeDirection = deltaX < 0 ? 'left' : 'right'
      const callback = dir === 'left' ? onSwipeLeft : onSwipeRight

      if (Math.abs(deltaX) >= threshold && callback) {
        if (reducedMotion.current) {
          reset()
          callback()
        } else {
          const offset = deltaX < 0 ? -120 : 120
          setStyle({
            transform: `translateX(${offset}%)`,
            opacity: 0,
            transition: `transform ${SLIDE_OUT_DURATION}ms ease, opacity ${SLIDE_OUT_DURATION}ms ease`,
            willChange: 'transform, opacity',
          })
          setTimeout(() => {
            reset()
            callback()
          }, SLIDE_OUT_DURATION)
        }
      } else {
        // Spring back
        setStyle({
          transform: 'translateX(0)',
          opacity: 1,
          transition: `transform ${SLIDE_OUT_DURATION}ms ease, opacity ${SLIDE_OUT_DURATION}ms ease`,
        })
        setTimeout(reset, SLIDE_OUT_DURATION)
      }
    },
    [onSwipeLeft, onSwipeRight, threshold, reset]
  )

  const onPointerCancel = useCallback(
    (e: React.PointerEvent) => {
      if (captured.current) {
        const el = e.currentTarget as HTMLElement
        try {
          el.releasePointerCapture(e.pointerId)
        } catch {
          // no-op : pointer deja relache
        }
      }
      setStyle({
        transform: 'translateX(0)',
        opacity: 1,
        transition: `transform ${SLIDE_OUT_DURATION}ms ease, opacity ${SLIDE_OUT_DURATION}ms ease`,
      })
      setTimeout(reset, SLIDE_OUT_DURATION)
    },
    [reset]
  )

  const handlers: SwipeHandlers = {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
  }

  return { handlers, style, isSwiping, direction, progress }
}
