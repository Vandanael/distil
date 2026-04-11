// Service Worker Distil — gestion des push notifications
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
