const CACHE_NAME = '2aps-astro-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
];

// Installation du Service Worker et mise en cache des fichiers de base
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Fichiers mis en cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Interception des requêtes réseau
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // On retourne le fichier en cache s'il existe, sinon on fait la requête réseau
        return response || fetch(event.request);
      })
  );
});