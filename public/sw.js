// Service Worker Distil — push notifications + cache offline
const CACHE_VERSION = 'DISTIL_V2'
const ARTICLE_CACHE = `distil-articles-${CACHE_VERSION}`
const IMAGE_CACHE = `distil-images-${CACHE_VERSION}`
const STATIC_CACHE = `distil-static-${CACHE_VERSION}`
const ROUTE_CACHE = `distil-routes-${CACHE_VERSION}`
const IMAGE_MAX = 50

// Invalide les anciens caches au déploiement
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !k.endsWith(CACHE_VERSION))
          .map((k) => caches.delete(k))
      )
    )
  )
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Cache-first pour les assets statiques Next.js (immutable)
  if (url.pathname.startsWith('/_next/static/') && event.request.method === 'GET') {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request)
        if (cached) return cached
        const response = await fetch(event.request)
        if (response.ok) cache.put(event.request, response.clone())
        return response
      })
    )
    return
  }

  // Network-first pour /feed et /library (fallback cache si offline)
  if (
    (url.pathname === '/feed' || url.pathname.startsWith('/library')) &&
    event.request.method === 'GET'
  ) {
    event.respondWith(
      caches.open(ROUTE_CACHE).then(async (cache) => {
        try {
          const response = await fetch(event.request)
          if (response.ok) cache.put(event.request, response.clone())
          return response
        } catch {
          const cached = await cache.match(event.request)
          if (cached) return cached
          return Response.error()
        }
      })
    )
    return
  }

  // Cache-first pour les pages article déjà consultées
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

  // Cache-first pour les images passant par l'optimiseur Next.js
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
