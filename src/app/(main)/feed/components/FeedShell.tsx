'use client'

import { useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useFeedKeyboard } from '@/lib/hooks/useFeedKeyboard'
import { dismissArticle } from '../../article/[id]/actions'
import { useLocale } from '@/lib/i18n/context'
import { useDismissContext } from './DismissContext'

type Props = {
  className?: string
  children: React.ReactNode
}

export function FeedShell({ className, children }: Props) {
  const router = useRouter()
  const { t } = useLocale()
  const { dismissById, undoById } = useDismissContext()
  const timerRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const handleDismiss = useCallback(
    (articleId: string) => {
      dismissById(articleId)

      if (timerRef.current[articleId]) clearTimeout(timerRef.current[articleId])

      toast.success(t.article.dismissed, {
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
        await dismissArticle(articleId)
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

  useFeedKeyboard({ onDismiss: handleDismiss, onNavigate: handleNavigate })

  return (
    <div className={className} data-testid="feed-articles">
      {children}
      {/* Hint clavier discret, desktop only */}
      <p className="hidden md:block font-ui text-xs text-muted-foreground/40 pt-6 select-none">
        j/k naviguer · Enter ouvrir · d rejeter
      </p>
    </div>
  )
}
