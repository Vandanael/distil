'use client'

import { useState } from 'react'
import { toast } from 'sonner'

// Doit correspondre a la constante ARTICLE_CACHE dans public/sw.js
const ARTICLE_CACHE = 'distil-articles-v1'

type Props = { articleId: string }

export function SaveOfflineButton({ articleId }: Props) {
  const [saved, setSaved] = useState(false)
  const [isPending, setIsPending] = useState(false)

  async function handleSave() {
    if (!('caches' in window)) {
      toast.error('Mise en cache non supportee sur ce navigateur')
      return
    }
    setIsPending(true)
    try {
      const cache = await caches.open(ARTICLE_CACHE)
      const response = await fetch(`/article/${articleId}`)
      if (!response.ok) throw new Error('Erreur reseau')
      await cache.put(`/article/${articleId}`, response)
      setSaved(true)
      toast.success('Article sauvegarde pour lecture hors-ligne')
    } catch {
      toast.error('Erreur lors de la mise en cache')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleSave()}
      disabled={saved || isPending}
      aria-label={saved ? 'Article sauvegarde hors-ligne' : 'Sauvegarder pour lire hors-ligne'}
      className={[
        'font-ui text-[13px] transition-colors disabled:opacity-50',
        saved ? 'text-accent cursor-default' : 'text-muted-foreground hover:text-foreground',
      ].join(' ')}
    >
      {isPending ? '...' : saved ? 'Hors-ligne' : 'Hors-ligne ?'}
    </button>
  )
}
