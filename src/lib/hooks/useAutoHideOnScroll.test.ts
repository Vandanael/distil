import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAutoHideOnScroll } from './useAutoHideOnScroll'

function setScroll(y: number, scrollHeight: number, clientHeight: number) {
  Object.defineProperty(window, 'scrollY', { configurable: true, value: y })
  Object.defineProperty(document.documentElement, 'scrollHeight', {
    configurable: true,
    value: scrollHeight,
  })
  Object.defineProperty(document.documentElement, 'clientHeight', {
    configurable: true,
    value: clientHeight,
  })
}

function fireScroll() {
  act(() => {
    window.dispatchEvent(new Event('scroll'))
  })
}

describe('useAutoHideOnScroll', () => {
  beforeEach(() => {
    setScroll(0, 3000, 800)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('visible au sommet', () => {
    const { result } = renderHook(() => useAutoHideOnScroll())
    expect(result.current).toBe(true)
  })

  it('se masque en scrollant vers le bas hors zones', () => {
    const { result } = renderHook(() => useAutoHideOnScroll())
    setScroll(600, 3000, 800)
    fireScroll()
    setScroll(900, 3000, 800)
    fireScroll()
    expect(result.current).toBe(false)
  })

  it('se reaffiche en scrollant vers le haut', () => {
    const { result } = renderHook(() => useAutoHideOnScroll())
    setScroll(900, 3000, 800)
    fireScroll()
    setScroll(1400, 3000, 800)
    fireScroll()
    expect(result.current).toBe(false)
    setScroll(1200, 3000, 800)
    fireScroll()
    expect(result.current).toBe(true)
  })

  it('reste visible pres du bas du document', () => {
    const { result } = renderHook(() => useAutoHideOnScroll())
    // max = 3000 - 800 = 2200 ; y=2000 => bottomZone 300 => distant de 200 (<300) -> visible
    setScroll(900, 3000, 800)
    fireScroll()
    setScroll(1600, 3000, 800)
    fireScroll()
    expect(result.current).toBe(false)
    setScroll(2000, 3000, 800)
    fireScroll()
    expect(result.current).toBe(true)
  })

  it('ignore les micro-mouvements sous le threshold', () => {
    const { result } = renderHook(() => useAutoHideOnScroll({ threshold: 20 }))
    setScroll(600, 3000, 800)
    fireScroll()
    setScroll(1000, 3000, 800)
    fireScroll()
    expect(result.current).toBe(false)
    // Remontee minuscule (delta -5), sous threshold -> pas de basculement
    setScroll(995, 3000, 800)
    fireScroll()
    expect(result.current).toBe(false)
  })
})
