// ── Push Notification Service Worker ─────────────────────────
// Ce fichier est importé par le SW principal via importScripts

// Écouter les notifications push
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'Jang - Freelance', body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'Jang - Freelance';
  const options = {
    body: data.body || 'Vous avez une nouvelle notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'jang-notification',
    renotify: !!data.tag,
    data: {
      url: data.url || '/',
      type: data.type || 'general',
    },
    actions: data.actions || [],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Clic sur la notification → ouvrir l'URL correspondante
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si un onglet Jang est déjà ouvert, le focus et naviguer
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(targetUrl);
          return;
        }
      }
      // Sinon ouvrir un nouvel onglet
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Fermer la notification (swipe / dismiss)
self.addEventListener('notificationclose', (event) => {
  // On peut tracker les notifications ignorées ici si besoin
});
