const CACHE_NAME = 'paket-v1.2.2';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './css/style.css',
    './js/utils.js',
    './js/db.js',
    './js/store.js',
    './js/package.js',
    './js/ocr.js',
    './js/stats.js',
    './js/trip.js',
    './js/pickup.js',
    './js/barcode.js',
    './js/reminder.js',
    './js/sync.js',
    './js/audit-log.js',
    './js/admin.js',
    './js/settings.js',
    './js/dashboard.js',
    './js/app.js',
    './manifest.json',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
    'https://cdn.jsdelivr.net/npm/jsbarcode@3/dist/JsBarcode.all.min.js',
    'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js',
];

// Listen for skip waiting message from client
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Install Event
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Caching app shell');
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
});

// Activate Event - clean old caches and claim clients
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim()) // Take control of all open pages immediately
    );
});

// Fetch Event - Network-First for navigations & SW, Cache-First for assets
self.addEventListener('fetch', event => {
    const requestUrl = new URL(event.request.url);

    // Network-first for HTML navigations (always get latest page)
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseToCache);
                    });
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // Network-first for local JS/CSS files (always check for updates)
    if (requestUrl.origin === location.origin &&
        (requestUrl.pathname.endsWith('.js') || requestUrl.pathname.endsWith('.css') || requestUrl.pathname.endsWith('.json'))) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    if (response && response.status === 200) {
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, responseToCache);
                        });
                    }
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // Cache-first for external CDN resources (fonts, libraries)
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }

                const fetchRequest = event.request.clone();
                return fetch(fetchRequest).then(
                    response => {
                        if (!response || response.status !== 200) {
                            return response;
                        }

                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    }
                );
            })
    );
});
