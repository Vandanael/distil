import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSwipeActions } from './useSwipeActions'

function makePointerEvent(type: string, x: number, y: number, pointerId = 1) {
  return {
    button: 0,
    clientX: x,
    clientY: y,
    pointerId,
    currentTarget: {
      setPointerCapture: vi.fn(),
      releasePointerCapture: vi.fn(),
    },
    preventDefault: vi.fn(),
  } as unknown as React.PointerEvent
}

describe('useSwipeActions', () => {
  it('declenche onSwipeLeft quand swipe vers la gauche au-dessus du seuil', () => {
    vi.useFakeTimers()
    const onSwipeLeft = vi.fn()
    const onSwipeRight = vi.fn()
    const { result } = renderHook(() =>
      useSwipeActions({ onSwipeLeft, onSwipeRight, threshold: 80 })
    )

    act(() => {
      result.current.handlers.onPointerDown(makePointerEvent('pointerdown', 300, 100))
    })
    act(() => {
      result.current.handlers.onPointerMove(makePointerEvent('pointermove', 200, 100))
    })
    act(() => {
      result.current.handlers.onPointerUp(makePointerEvent('pointerup', 200, 100))
    })
    act(() => {
      vi.advanceTimersByTime(250)
    })

    expect(onSwipeLeft).toHaveBeenCalledTimes(1)
    expect(onSwipeRight).not.toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('declenche onSwipeRight quand swipe vers la droite au-dessus du seuil', () => {
    vi.useFakeTimers()
    const onSwipeLeft = vi.fn()
    const onSwipeRight = vi.fn()
    const { result } = renderHook(() =>
      useSwipeActions({ onSwipeLeft, onSwipeRight, threshold: 80 })
    )

    act(() => {
      result.current.handlers.onPointerDown(makePointerEvent('pointerdown', 100, 100))
    })
    act(() => {
      result.current.handlers.onPointerMove(makePointerEvent('pointermove', 200, 100))
    })
    act(() => {
      result.current.handlers.onPointerUp(makePointerEvent('pointerup', 200, 100))
    })
    act(() => {
      vi.advanceTimersByTime(250)
    })

    expect(onSwipeRight).toHaveBeenCalledTimes(1)
    expect(onSwipeLeft).not.toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('ne declenche rien sous le seuil', () => {
    const onSwipeLeft = vi.fn()
    const { result } = renderHook(() => useSwipeActions({ onSwipeLeft, threshold: 80 }))

    act(() => {
      result.current.handlers.onPointerDown(makePointerEvent('pointerdown', 200, 100))
    })
    act(() => {
      result.current.handlers.onPointerMove(makePointerEvent('pointermove', 170, 100))
    })
    act(() => {
      result.current.handlers.onPointerUp(makePointerEvent('pointerup', 170, 100))
    })

    expect(onSwipeLeft).not.toHaveBeenCalled()
  })

  it('ignore le mouvement vertical', () => {
    const onSwipeLeft = vi.fn()
    const { result } = renderHook(() => useSwipeActions({ onSwipeLeft, threshold: 80 }))

    act(() => {
      result.current.handlers.onPointerDown(makePointerEvent('pointerdown', 200, 100))
    })
    act(() => {
      result.current.handlers.onPointerMove(makePointerEvent('pointermove', 210, 200))
    })
    act(() => {
      result.current.handlers.onPointerUp(makePointerEvent('pointerup', 210, 200))
    })

    expect(onSwipeLeft).not.toHaveBeenCalled()
    expect(result.current.isSwiping).toBe(false)
  })

  it('est inactif quand enabled=false', () => {
    const onSwipeLeft = vi.fn()
    const { result } = renderHook(() =>
      useSwipeActions({ onSwipeLeft, threshold: 80, enabled: false })
    )

    act(() => {
      result.current.handlers.onPointerDown(makePointerEvent('pointerdown', 300, 100))
    })
    act(() => {
      result.current.handlers.onPointerMove(makePointerEvent('pointermove', 100, 100))
    })
    act(() => {
      result.current.handlers.onPointerUp(makePointerEvent('pointerup', 100, 100))
    })

    expect(onSwipeLeft).not.toHaveBeenCalled()
  })

  it('expose la direction et la progression pendant le geste', () => {
    const onSwipeLeft = vi.fn()
    const { result } = renderHook(() => useSwipeActions({ onSwipeLeft, threshold: 100 }))

    act(() => {
      result.current.handlers.onPointerDown(makePointerEvent('pointerdown', 200, 100))
    })
    act(() => {
      result.current.handlers.onPointerMove(makePointerEvent('pointermove', 150, 102))
    })

    expect(result.current.direction).toBe('left')
    expect(result.current.progress).toBeGreaterThan(0)
    expect(result.current.progress).toBeLessThanOrEqual(1)
    expect(result.current.isSwiping).toBe(true)
  })

  it('ne trigger pas si la direction n a pas de callback', () => {
    vi.useFakeTimers()
    const onSwipeLeft = vi.fn()
    const { result } = renderHook(() => useSwipeActions({ onSwipeLeft, threshold: 80 }))

    // Swipe a droite sans onSwipeRight : ne doit rien declencher
    act(() => {
      result.current.handlers.onPointerDown(makePointerEvent('pointerdown', 100, 100))
    })
    act(() => {
      result.current.handlers.onPointerMove(makePointerEvent('pointermove', 250, 100))
    })
    act(() => {
      result.current.handlers.onPointerUp(makePointerEvent('pointerup', 250, 100))
    })
    act(() => {
      vi.advanceTimersByTime(250)
    })

    expect(onSwipeLeft).not.toHaveBeenCalled()
    vi.useRealTimers()
  })
})
