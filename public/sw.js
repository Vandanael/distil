// Service Worker Distil — push notifications + cache offline
const ARTICLE_CACHE = 'distil-articles-v1'
const IMAGE_CACHE = 'distil-images-v1'
const IMAGE_MAX = 50

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Cache-First pour les pages article deja consultees
  if (url.pathname.startsWith('/article/') && event.request.method === 'GET') {
    event.respondWith(
      caches.open(ARTICLE_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request)
        if (cached) return cached
        const response = await fetch(event.request)
        if (response.ok) cache.put(event.request, response.clone())
        return response
      })
    )
    return
  }

  // Cache-First pour les images passant par l'optimiseur Next.js
  if (url.pathname === '/_next/image' && event.request.method === 'GET') {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request)
        if (cached) return cached
        const response = await fetch(event.request)
        if (response.ok) {
          const keys = await cache.keys()
          if (keys.length >= IMAGE_MAX) await cache.delete(keys[0])
          cache.put(event.request, response.clone())
        }
        return response
      })
    )
    return
  }
})


self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  const title = data.title ?? 'Distil'
  const options = {
    body: data.body ?? 'Votre veille du jour est prete.',
    icon: '/icon.svg',
    badge: '/icon.svg',
    data: { url: data.url ?? '/feed' },
    tag: 'distil-daily', // remplace la notif precedente si non lue
    renotify: false,
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/feed'
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(url) && 'focus' in client) return client.focus()
        }
        return clients.openWindow(url)
      })
  )
})
