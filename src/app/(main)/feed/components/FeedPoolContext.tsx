'use client'

import { createContext, useContext, useState, useCallback, useRef, useMemo } from 'react'
import { markSoftLimitShown } from '../actions'

const SOFT_UNLOCK_LIMIT = 8
export const POOL_RESERVE_SIZE = 8

type FeedPoolContextValue = {
  reserveIds: readonly string[]
  revealedIds: Set<string>
  dismissCount: number
  showSoftLimitNow: boolean
  promoteFromReserve: () => void
  dismissSoftLimit: () => void
}

const FeedPoolContext = createContext<FeedPoolContextValue | null>(null)

export function FeedPoolProvider({
  children,
  reserveIds,
  softLimitAlreadyShown,
}: {
  children: React.ReactNode
  reserveIds: string[]
  softLimitAlreadyShown: boolean
}) {
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set())
  const [dismissCount, setDismissCount] = useState(0)
  const [showSoftLimitNow, setShowSoftLimitNow] = useState(false)
  // hasTriggeredRef reste true pour toute la session : empêche la ré-apparition
  // même si dismissSoftLimit() remet showSoftLimitNow à false.
  const hasTriggeredRef = useRef(softLimitAlreadyShown)
  const nextIndexRef = useRef(0)
  const reserveIdsRef = useRef(reserveIds)

  const promoteFromReserve = useCallback(() => {
    setDismissCount((prev) => {
      const next = prev + 1
      // Transition exacte 7 → 8 : un seul trigger par édition.
      if (next === SOFT_UNLOCK_LIMIT && !hasTriggeredRef.current) {
        hasTriggeredRef.current = true
        setShowSoftLimitNow(true)
        void markSoftLimitShown()
      }
      return next
    })
    const ids = reserveIdsRef.current
    if (nextIndexRef.current < ids.length) {
      const nextId = ids[nextIndexRef.current]
      nextIndexRef.current++
      setRevealedIds((prev) => new Set(prev).add(nextId))
    }
  }, [])

  const dismissSoftLimit = useCallback(() => {
    setShowSoftLimitNow(false)
  }, [])

  const value = useMemo(
    () => ({
      reserveIds,
      revealedIds,
      dismissCount,
      showSoftLimitNow,
      promoteFromReserve,
      dismissSoftLimit,
    }),
    [reserveIds, revealedIds, dismissCount, showSoftLimitNow, promoteFromReserve, dismissSoftLimit]
  )

  return <FeedPoolContext.Provider value={value}>{children}</FeedPoolContext.Provider>
}

export function useFeedPool(): FeedPoolContextValue | null {
  return useContext(FeedPoolContext)
}
