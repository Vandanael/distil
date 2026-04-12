'use client'

import { useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useFeedKeyboard } from '@/lib/hooks/useFeedKeyboard'
import { dismissArticle } from '../../article/[id]/actions'

type Props = {
  className?: string
  children: React.ReactNode
}

export function FeedShell({ className, children }: Props) {
  const router = useRouter()
  const cancelledRef = useRef<Record<string, boolean>>({})
  const timerRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const handleDismiss = useCallback(
    (articleId: string) => {
      // Masquer visuellement la carte (via ArticleCard interne)
      // On ne peut pas piloter le state interne de ArticleCard depuis ici,
      // donc on appelle directement le server action apres le delai undo
      cancelledRef.current[articleId] = false

      if (timerRef.current[articleId]) clearTimeout(timerRef.current[articleId])

      toast.success('Article masque', {
        action: {
          label: 'Annuler',
          onClick: () => {
            cancelledRef.current[articleId] = true
            if (timerRef.current[articleId]) clearTimeout(timerRef.current[articleId])
          },
        },
        duration: 4000,
      })

      timerRef.current[articleId] = setTimeout(async () => {
        if (!cancelledRef.current[articleId]) {
          await dismissArticle(articleId)
        }
        delete cancelledRef.current[articleId]
        delete timerRef.current[articleId]
      }, 4000)
    },
    []
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
    </div>
  )
}
