'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { keepArticle } from '../actions'
import { Button } from '@/components/ui/button'

type Props = {
  id: string
  title: string | null
  siteName: string | null
  rejectionReason: string | null
  score: number | null
  url: string
}

export function RejectedCard({ id, title, siteName, rejectionReason, score, url }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleKeep() {
    startTransition(async () => {
      await keepArticle(id)
      toast.success('Article remis dans le feed')
    })
  }

  return (
    <div
      className="space-y-3 border-b border-border pb-6 last:border-0"
      data-testid={`rejected-card-${id}`}
    >
      <div className="space-y-1">
        <div className="flex items-start justify-between gap-4">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-ui text-base font-semibold text-foreground hover:text-accent transition-colors"
          >
            {title ?? 'Sans titre'}
          </a>
          <div className="flex items-center gap-2 shrink-0">
            {siteName && (
              <span className="font-ui text-[13px] text-muted-foreground">{siteName}</span>
            )}
            {score !== null && (
              <span
                className="font-ui text-xs tabular-nums text-muted-foreground"
                data-testid={`score-badge-${id}`}
              >
                {score}/100
              </span>
            )}
          </div>
        </div>
        {rejectionReason && (
          <p
            className="font-body text-sm text-muted-foreground"
            data-testid={`rejection-reason-${id}`}
          >
            {rejectionReason}
          </p>
        )}
      </div>

      <Button
        variant="secondary"
        size="sm"
        onClick={handleKeep}
        disabled={isPending}
        data-testid={`keep-anyway-${id}`}
      >
        {isPending ? 'En cours...' : 'Garder quand même'}
      </Button>
    </div>
  )
}
