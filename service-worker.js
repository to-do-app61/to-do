const CACHE_NAME = 'taskalarm-v1';
const assets = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/manifest.json'
];

// Installazione: Salva i file essenziali nella cache del dispositivo
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(assets);
        })
    );
    console.log('Service Worker installato e file messi in cache');
});

// Intercettazione delle richieste: Se l'app è offline, serve i file dalla cache
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});