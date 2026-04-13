import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSwipeToDismiss } from './useSwipeToDismiss'

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

describe('useSwipeToDismiss', () => {
  it('ne declenche pas onDismiss sous le seuil', () => {
    const onDismiss = vi.fn()
    const { result } = renderHook(() => useSwipeToDismiss({ onDismiss, threshold: 80 }))

    act(() => {
      result.current.handlers.onPointerDown(makePointerEvent('pointerdown', 200, 100))
    })
    act(() => {
      result.current.handlers.onPointerMove(makePointerEvent('pointermove', 150, 100))
    })
    act(() => {
      result.current.handlers.onPointerUp(makePointerEvent('pointerup', 150, 100))
    })

    expect(onDismiss).not.toHaveBeenCalled()
  })

  it('declenche onDismiss au-dessus du seuil', () => {
    vi.useFakeTimers()
    const onDismiss = vi.fn()
    const { result } = renderHook(() => useSwipeToDismiss({ onDismiss, threshold: 80 }))

    act(() => {
      result.current.handlers.onPointerDown(makePointerEvent('pointerdown', 300, 100))
    })
    act(() => {
      result.current.handlers.onPointerMove(makePointerEvent('pointermove', 200, 100))
    })
    act(() => {
      result.current.handlers.onPointerUp(makePointerEvent('pointerup', 200, 100))
    })

    // Attend la fin de l'animation slide-out
    act(() => {
      vi.advanceTimersByTime(250)
    })

    expect(onDismiss).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })

  it('ignore le mouvement vertical', () => {
    const onDismiss = vi.fn()
    const { result } = renderHook(() => useSwipeToDismiss({ onDismiss, threshold: 80 }))

    act(() => {
      result.current.handlers.onPointerDown(makePointerEvent('pointerdown', 200, 100))
    })
    // Mouvement principalement vertical
    act(() => {
      result.current.handlers.onPointerMove(makePointerEvent('pointermove', 210, 200))
    })
    act(() => {
      result.current.handlers.onPointerUp(makePointerEvent('pointerup', 210, 200))
    })

    expect(onDismiss).not.toHaveBeenCalled()
    expect(result.current.isSwiping).toBe(false)
  })

  it('est inactif quand enabled=false', () => {
    const onDismiss = vi.fn()
    const { result } = renderHook(() =>
      useSwipeToDismiss({ onDismiss, threshold: 80, enabled: false })
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

    expect(onDismiss).not.toHaveBeenCalled()
  })

  it('signale isSwiping pendant un geste horizontal', () => {
    const onDismiss = vi.fn()
    const { result } = renderHook(() => useSwipeToDismiss({ onDismiss, threshold: 80 }))

    act(() => {
      result.current.handlers.onPointerDown(makePointerEvent('pointerdown', 200, 100))
    })
    act(() => {
      result.current.handlers.onPointerMove(makePointerEvent('pointermove', 150, 102))
    })

    expect(result.current.isSwiping).toBe(true)
  })
})
