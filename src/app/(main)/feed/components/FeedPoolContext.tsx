'use client'

import { createContext, useContext, useState, useCallback } from 'react'

type FeedPoolContextValue = {
  revealedIds: Set<string>
  reserveIds: string[]
  dismissCount: number
  showSoftLimit: boolean
  promoteFromReserve: () => void
}

const FeedPoolContext = createContext<FeedPoolContextValue | null>(null)

const SOFT_UNLOCK_LIMIT = 8

export function FeedPoolProvider({
  reserveIds,
  children,
}: {
  reserveIds: string[]
  children: React.ReactNode
}) {
  const [revealedIds, setRevealedIds] = useState<Set<string>>(() => new Set())
  const [currentReserve, setCurrentReserve] = useState<string[]>(reserveIds)
  const [dismissCount, setDismissCount] = useState(0)
  const [showSoftLimit, setShowSoftLimit] = useState(false)

  const promoteFromReserve = useCallback(() => {
    setCurrentReserve((prev) => {
      if (prev.length === 0) return prev
      const [next, ...rest] = prev
      setRevealedIds((ids) => new Set(ids).add(next))
      setDismissCount((count) => {
        const newCount = count + 1
        if (newCount >= SOFT_UNLOCK_LIMIT && !showSoftLimit) {
          setShowSoftLimit(true)
        }
        return newCount
      })
      return rest
    })
  }, [showSoftLimit])

  return (
    <FeedPoolContext.Provider
      value={{ revealedIds, reserveIds: currentReserve, dismissCount, showSoftLimit, promoteFromReserve }}
    >
      {children}
    </FeedPoolContext.Provider>
  )
}

export function useFeedPool(): FeedPoolContextValue {
  const ctx = useContext(FeedPoolContext)
  if (!ctx) {
    // Pas de pool : retourne un contexte vide
    return {
      revealedIds: new Set(),
      reserveIds: [],
      dismissCount: 0,
      showSoftLimit: false,
      promoteFromReserve: () => {},
    }
  }
  return ctx
}