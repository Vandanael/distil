'use client'

import { useEffect, useState } from 'react'

export function ReadingProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    function onScroll() {
      const doc = document.documentElement
      const scrollTop = doc.scrollTop || document.body.scrollTop
      const scrollHeight = doc.scrollHeight - doc.clientHeight
      setProgress(scrollHeight <= 0 ? 0 : Math.min(100, (scrollTop / scrollHeight) * 100))
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (progress <= 0) return null

  return (
    <div
      aria-hidden="true"
      className="fixed top-12 left-0 z-50 h-[3px] pointer-events-none bg-accent"
      style={{ width: `${progress}%`, transition: 'width 80ms linear' }}
    />
  )
}
