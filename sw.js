const CACHE_NAME = '2aps-astro-v2';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
];

// --- 1. INSTALLATION ---
// On force le nouveau Service Worker à s'activer sans attendre
self.addEventListener('install', event => {
  self.skipWaiting(); 
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Mise en cache des fichiers de base');
      return cache.addAll(urlsToCache);
    })
  );
});

// --- 2. ACTIVATION ---
// On nettoie les anciens caches pour éviter d'accumuler les versions obsolètes
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Suppression de l\'ancien cache :', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Prend le contrôle immédiat de la page ouverte
  );
});

// --- 3. STRATÉGIE DE CACHE (NETWORK FIRST) ---
// On interroge Internet en priorité. Si le réseau répond, on met à jour le cache.
// Si on est hors-ligne ou sur le terrain sans réseau, on charge la version du cache.
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Si la requête est valide, on clone la réponse pour la mettre en cache
        if (event.request.method === 'GET') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // En cas de panne de réseau, on bascule sur le cache local
        return caches.match(event.request);
      })
  );
});

// --- 4. GESTION DES NOTIFICATIONS PUSH ---
// Intercepte les signaux Push envoyés par le serveur/Edge Function
self.addEventListener('push', event => {
  if (event.data) {
    try {
      const data = event.data.json();
      
      const options = {
        body: data.body,
        icon: './icon-192.png',
        badge: './icon-192.png',
        vibrate: [100, 50, 100],
        data: { url: data.url || './' }
      };

      event.waitUntil(
        self.registration.showNotification(data.title, options)
      );
    } catch (err) {
      console.error('Erreur lors de la réception du push payload:', err);
    }
  }
});

// --- 5. ACTION AU CLIC SUR LA NOTIFICATION ---
// Redirige l'utilisateur vers l'application lorsqu'il clique sur l'alerte
self.addEventListener('notificationclick', event => {
  event.notification.close(); // Ferme la notification dans la barre du téléphone
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});