'use client'

import { createContext, useContext, useState, useCallback, useRef, useMemo } from 'react'

const SOFT_UNLOCK_LIMIT = 8
export const POOL_RESERVE_SIZE = 8

type FeedPoolContextValue = {
  reserveIds: readonly string[]
  revealedIds: Set<string>
  dismissCount: number
  showSoftLimit: boolean
  promoteFromReserve: () => void
}

const FeedPoolContext = createContext<FeedPoolContextValue | null>(null)

export function FeedPoolProvider({
  children,
  reserveIds,
}: {
  children: React.ReactNode
  reserveIds: string[]
}) {
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set())
  const [dismissCount, setDismissCount] = useState(0)
  const nextIndexRef = useRef(0)
  // reserveIds vient du serveur, stable pour toute la session de la page
  const reserveIdsRef = useRef(reserveIds)

  const promoteFromReserve = useCallback(() => {
    setDismissCount((prev) => prev + 1)
    const ids = reserveIdsRef.current
    if (nextIndexRef.current < ids.length) {
      const nextId = ids[nextIndexRef.current]
      nextIndexRef.current++
      setRevealedIds((prev) => new Set(prev).add(nextId))
    }
  }, [])

  const showSoftLimit = dismissCount >= SOFT_UNLOCK_LIMIT

  const value = useMemo(
    () => ({ reserveIds, revealedIds, dismissCount, showSoftLimit, promoteFromReserve }),
    [reserveIds, revealedIds, dismissCount, showSoftLimit, promoteFromReserve]
  )

  return <FeedPoolContext.Provider value={value}>{children}</FeedPoolContext.Provider>
}

export function useFeedPool(): FeedPoolContextValue | null {
  return useContext(FeedPoolContext)
}
