'use client'

import { useEffect, useRef, useState } from 'react'

type Options = {
  /** Pixels de scroll ignores pour eviter le jitter. */
  threshold?: number
  /** Zone haute ou la barre reste visible. */
  topZone?: number
  /** Zone basse (avant la fin du document) ou la barre reste visible. */
  bottomZone?: number
}

/**
 * Retourne `true` quand on scroll vers le haut ou qu'on est pres du sommet/pied
 * de page. Se replie (`false`) quand on scroll vers le bas au milieu d'un article.
 */
export function useAutoHideOnScroll({
  threshold = 8,
  topZone = 120,
  bottomZone = 300,
}: Options = {}): boolean {
  const [visible, setVisible] = useState(true)
  const lastY = useRef(0)

  useEffect(() => {
    function onScroll() {
      const y = window.scrollY
      const doc = document.documentElement
      const max = doc.scrollHeight - doc.clientHeight
      const nearBottom = max - y <= bottomZone
      const nearTop = y <= topZone
      const delta = y - lastY.current
      lastY.current = y

      if (nearTop || nearBottom) {
        setVisible(true)
        return
      }
      if (Math.abs(delta) < threshold) return
      setVisible(delta < 0)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold, topZone, bottomZone])

  return visible
}
