'use client'

import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import { useFeedPool } from './FeedPoolContext'

type DismissContextValue = {
  dismissedIds: Set<string>
  dismissById: (id: string) => void
  undoById: (id: string) => void
}

const DismissContext = createContext<DismissContextValue | null>(null)

export function DismissProvider({ children }: { children: React.ReactNode }) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())
  const pool = useFeedPool()
  const poolRef = useRef(pool)
  // Sync hors render : la lint rule react-hooks/refs interdit d'écrire
  // dans poolRef pendant le render. Le ref garde promoteFromReserve stable
  // sans capturer pool dans dismissById.
  useEffect(() => {
    poolRef.current = pool
  }, [pool])

  const dismissById = useCallback((id: string) => {
    setDismissedIds((prev) => new Set(prev).add(id))
    poolRef.current?.promoteFromReserve()
  }, [])

  const undoById = useCallback((id: string) => {
    setDismissedIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }, [])

  return (
    <DismissContext.Provider value={{ dismissedIds, dismissById, undoById }}>
      {children}
    </DismissContext.Provider>
  )
}

export function useDismissContext(): DismissContextValue {
  const ctx = useContext(DismissContext)
  if (!ctx) throw new Error('useDismissContext doit être utilisé dans un DismissProvider')
  return ctx
}
