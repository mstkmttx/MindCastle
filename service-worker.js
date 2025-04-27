/**
 * Mind Castle - Service Worker
 * Handles caching and offline functionality
 */

const CACHE_NAME = 'mindcastle-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/app.js',
    '/js/particles.js',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    '/icons/apple-touch-icon.png',
    '/privacy.html',
    '/terms.html',
    'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Inter:wght@400;500;600&display=swap'
];

// Install event - cache assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Caching files');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('Service Worker: Clearing old cache');
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
    // Skip for non-GET requests or for certain URLs
    if (event.request.method !== 'GET' || 
        event.request.url.includes('chrome-extension')) {
        return;
    }

    event.respondWith(
        // Try network first, then fall back to cache
        fetch(event.request)
            .then(response => {
                // Clone the response
                const responseClone = response.clone();
                
                // Open cache
                caches.open(CACHE_NAME)
                    .then(cache => {
                        // Add response to cache
                        cache.put(event.request, responseClone);
                    });
                
                return response;
            })
            .catch(() => {
                // If network fails, try to serve from cache
                return caches.match(event.request)
                    .then(cachedResponse => {
                        if (cachedResponse) {
                            return cachedResponse;
                        }
                        
                        // If it's an HTML request, serve offline page
                        if (event.request.headers.get('accept').includes('text/html')) {
                            // If offline page exists in cache, serve it
                            return caches.match('/')
                                .then(offlineResponse => {
                                    return offlineResponse || new Response(
                                        '<html><body><h1>Mind Castle Offline</h1>' + 
                                        '<p>You are currently offline. ' +
                                        'Please reconnect to access Mind Castle.</p></body></html>',
                                        {
                                            headers: { 'Content-Type': 'text/html' }
                                        }
                                    );
                                });
                        }
                    });
            })
    );
}); 