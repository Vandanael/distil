'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const arr = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) arr[i] = rawData.charCodeAt(i)
  return arr.buffer
}

type State = 'unsupported' | 'loading' | 'subscribed' | 'unsubscribed'

export function PushSubscribe() {
  const [state, setState] = useState<State>('loading')

  useEffect(() => {
    async function init() {
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !VAPID_PUBLIC_KEY) {
        setState('unsupported')
        return
      }

      try {
        await navigator.serviceWorker.register('/sw.js')
        const reg = await navigator.serviceWorker.ready
        const sub = await reg.pushManager.getSubscription()
        setState(sub ? 'subscribed' : 'unsubscribed')
      } catch {
        setState('unsupported')
      }
    }

    void init()
  }, [])

  async function subscribe() {
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      })
      setState('subscribed')
      toast.success('Notifications activees')
    } catch {
      toast.error("Impossible d'activer les notifications")
    }
  }

  async function unsubscribe() {
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      await sub?.unsubscribe()
      await fetch('/api/push/subscribe', { method: 'DELETE' })
      setState('unsubscribed')
      toast.success('Notifications desactivees')
    } catch {
      toast.error('Erreur lors de la desactivation')
    }
  }

  if (state === 'unsupported' || !VAPID_PUBLIC_KEY) return null

  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <p className="font-ui text-sm font-medium text-foreground">Notification matinale</p>
        <p className="font-body text-xs text-muted-foreground">
          Recevez une notification quand votre veille du jour est prete.
        </p>
      </div>
      <button
        type="button"
        onClick={() => void (state === 'subscribed' ? unsubscribe() : subscribe())}
        disabled={state === 'loading'}
        data-testid="push-subscribe-btn"
        className={[
          'font-ui text-sm px-3 py-1.5 border transition-colors disabled:opacity-40',
          state === 'subscribed'
            ? 'border-accent text-accent hover:bg-accent/10'
            : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground',
        ].join(' ')}
      >
        {state === 'loading' ? '...' : state === 'subscribed' ? 'Activees' : 'Activer'}
      </button>
    </div>
  )
}
