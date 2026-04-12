'use client'

import { useCallback, useRef, useState } from 'react'

type UseSwipeToDismissOptions = {
  onDismiss: () => void
  threshold?: number
  enabled?: boolean
}

type SwipeHandlers = {
  onPointerDown: (e: React.PointerEvent) => void
  onPointerMove: (e: React.PointerEvent) => void
  onPointerUp: (e: React.PointerEvent) => void
  onPointerCancel: (e: React.PointerEvent) => void
}

type UseSwipeToDismissReturn = {
  handlers: SwipeHandlers
  style: React.CSSProperties
  isSwiping: boolean
}

const DEAD_ZONE = 10
const ANGLE_RATIO = 1.5
const SLIDE_OUT_DURATION = 200

export function useSwipeToDismiss({
  onDismiss,
  threshold = 80,
  enabled = true,
}: UseSwipeToDismissOptions): UseSwipeToDismissReturn {
  const [style, setStyle] = useState<React.CSSProperties>({})
  const [isSwiping, setIsSwiping] = useState(false)

  const startX = useRef(0)
  const startY = useRef(0)
  const locked = useRef<'horizontal' | 'vertical' | null>(null)
  const active = useRef(false)
  const reducedMotion = useRef(
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  )

  const reset = useCallback(() => {
    locked.current = null
    active.current = false
    setIsSwiping(false)
    setStyle({})
  }, [])

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!enabled || e.button !== 0) return
      const el = e.currentTarget as HTMLElement
      el.setPointerCapture(e.pointerId)
      startX.current = e.clientX
      startY.current = e.clientY
      locked.current = null
      active.current = true
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

      // Pas encore verrouille : determiner la direction
      if (!locked.current) {
        if (absDx < DEAD_ZONE && absDy < DEAD_ZONE) return
        if (absDx > absDy * ANGLE_RATIO) {
          locked.current = 'horizontal'
          setIsSwiping(true)
        } else {
          locked.current = 'vertical'
          return
        }
      }

      if (locked.current !== 'horizontal') return

      // Empecher le clic sur le Link pendant le swipe
      e.preventDefault()

      const opacity = Math.max(0.3, 1 - absDx / 300)
      setStyle({
        transform: `translateX(${deltaX}px)`,
        opacity,
        transition: 'none',
        willChange: 'transform, opacity',
      })
    },
    []
  )

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!active.current) return
      const el = e.currentTarget as HTMLElement
      el.releasePointerCapture(e.pointerId)

      if (locked.current !== 'horizontal') {
        reset()
        return
      }

      // Empecher la navigation du Link
      e.preventDefault()

      const deltaX = e.clientX - startX.current

      if (Math.abs(deltaX) >= threshold) {
        if (reducedMotion.current) {
          reset()
          onDismiss()
        } else {
          const direction = deltaX < 0 ? -120 : 120
          setStyle({
            transform: `translateX(${direction}%)`,
            opacity: 0,
            transition: `transform ${SLIDE_OUT_DURATION}ms ease, opacity ${SLIDE_OUT_DURATION}ms ease`,
            willChange: 'transform, opacity',
          })
          setTimeout(() => {
            reset()
            onDismiss()
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
    [onDismiss, threshold, reset]
  )

  const onPointerCancel = useCallback(
    (e: React.PointerEvent) => {
      const el = e.currentTarget as HTMLElement
      el.releasePointerCapture(e.pointerId)
      // Spring back
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

  return { handlers, style, isSwiping }
}
