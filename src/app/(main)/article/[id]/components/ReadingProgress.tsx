'use client'

import { useEffect, useState } from 'react'

export function ReadingProgress() {
  const [progress, setProgress] = useState(0)
  const [headerHeight, setHeaderHeight] = useState(0)

  useEffect(() => {
    const header = document.querySelector('header')

    function onScroll() {
      const doc = document.documentElement
      const scrollTop = doc.scrollTop || document.body.scrollTop
      const scrollHeight = doc.scrollHeight - doc.clientHeight
      setProgress(scrollHeight <= 0 ? 0 : Math.min(100, (scrollTop / scrollHeight) * 100))
    }

    function measureHeader() {
      setHeaderHeight(header ? header.getBoundingClientRect().height : 0)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', measureHeader)
    measureHeader()
    onScroll()

    const ro = header ? new ResizeObserver(measureHeader) : null
    if (ro && header) ro.observe(header)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', measureHeader)
      ro?.disconnect()
    }
  }, [])

  if (progress <= 0) return null

  return (
    <div
      aria-hidden="true"
      className="fixed left-0 z-50 h-[3px] pointer-events-none bg-accent"
      style={{
        top: `${headerHeight}px`,
        width: `${progress}%`,
        transition: 'width 80ms linear',
      }}
    />
  )
}
