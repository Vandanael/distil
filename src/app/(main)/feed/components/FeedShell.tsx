'use client'

import { useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useFeedKeyboard } from '@/lib/hooks/useFeedKeyboard'
import { addToRead, markNotInterested } from '@/app/(main)/article/[id]/actions'
import { useLocale } from '@/lib/i18n/context'
import { useDismissContext } from './DismissContext'

type Props = {
  className?: string
  children: React.ReactNode
}

export function FeedShell({ className, children }: Props) {
  const router = useRouter()
  const { locale, t } = useLocale()
  const { dismissById, undoById } = useDismissContext()
  const timerRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const handleNotInterested = useCallback(
    (articleId: string) => {
      dismissById(articleId)

      if (timerRef.current[articleId]) clearTimeout(timerRef.current[articleId])

      toast.success(t.article.notInterestedToast, {
        action: {
          label: t.article.undo,
          onClick: () => {
            undoById(articleId)
            if (timerRef.current[articleId]) clearTimeout(timerRef.current[articleId])
            delete timerRef.current[articleId]
          },
        },
        duration: 4000,
      })

      timerRef.current[articleId] = setTimeout(async () => {
        await markNotInterested(articleId)
        delete timerRef.current[articleId]
      }, 4000)
    },
    [dismissById, undoById, t]
  )

  const handleAddToRead = useCallback(
    (articleId: string) => {
      dismissById(articleId)

      if (timerRef.current[articleId]) clearTimeout(timerRef.current[articleId])

      toast.success(t.article.addedToRead, {
        action: {
          label: t.article.undo,
          onClick: () => {
            undoById(articleId)
            if (timerRef.current[articleId]) clearTimeout(timerRef.current[articleId])
            delete timerRef.current[articleId]
          },
        },
        duration: 4000,
      })

      timerRef.current[articleId] = setTimeout(async () => {
        await addToRead(articleId)
        delete timerRef.current[articleId]
      }, 4000)
    },
    [dismissById, undoById, t]
  )

  const handleNavigate = useCallback(
    (articleId: string) => {
      router.push(`/article/${articleId}`)
    },
    [router]
  )

  useFeedKeyboard({
    onNotInterested: handleNotInterested,
    onAddToRead: handleAddToRead,
    onNavigate: handleNavigate,
  })

  return (
    <div className={className} data-testid="feed-articles">
      {children}
      {/* Hint clavier discret, desktop only */}
      <p
        aria-hidden="true"
        className="hidden md:block font-ui text-sm text-muted-foreground/40 pt-6 lg:col-span-2 select-none"
      >
        ↑↓ naviguer · Enter ouvrir · d/← pas intéressé · → à lire
      </p>
    </div>
  )
}
