'use client'

import { useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useFeedKeyboard } from '@/lib/hooks/useFeedKeyboard'
import { archiveArticle, dismissArticle } from '@/app/(main)/article/[id]/actions'
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

  const handleArchive = useCallback(
    (articleId: string) => {
      dismissById(articleId)

      if (timerRef.current[articleId]) clearTimeout(timerRef.current[articleId])

      toast.success(locale === 'fr' ? 'Archive' : 'Archived', {
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
        await archiveArticle(articleId)
        delete timerRef.current[articleId]
      }, 4000)
    },
    [dismissById, undoById, locale, t]
  )

  const handleNavigate = useCallback(
    (articleId: string) => {
      router.push(`/article/${articleId}`)
    },
    [router]
  )

  useFeedKeyboard({
    onDismiss: handleDismiss,
    onArchive: handleArchive,
    onNavigate: handleNavigate,
  })

  return (
    <div className={className} data-testid="feed-articles">
      {children}
      {/* Hint clavier discret, desktop only */}
      <p className="hidden md:block font-ui text-xs text-muted-foreground/40 pt-6 lg:col-span-2 select-none">
        ↑↓ naviguer · Enter ouvrir · ← rejeter · → archiver
      </p>
    </div>
  )
}
