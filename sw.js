// Define a cache name for your app.
// IMPORTANT: Change this name whenever you update your app's files
// to ensure users get the latest version.
const CACHE_NAME = 'sca-v1.0.0';

// List of essential files to cache for offline use.
const urlsToCache = [
  '/',
  '/index.html',
  '/index.tsx', // This will be fetched by the browser's module loader
  '/fonts.css',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// The install event is fired when the service worker is first installed.
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  // waitUntil() ensures that the service worker will not install until the code inside it has successfully completed.
  event.waitUntil(
    // Open the cache.
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching app shell');
        // Add all the assets in urlsToCache to the cache.
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Installation complete.');
        // Activate the new service worker immediately.
        return self.skipWaiting();
      })
  );
});

// The activate event is fired after the installation is complete.
// It's a good place to clean up old caches.
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // If a cache's name is not our current CACHE_NAME, delete it.
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
        console.log('Service Worker: Activation complete.');
        // Take control of all pages under this service worker's scope immediately.
        return self.clients.claim();
    })
  );
});


// The fetch event is fired for every network request made by the page.
// This allows us to intercept requests and respond with cached assets.
self.addEventListener('fetch', event => {
  event.respondWith(
    // Try to find a match for the request in the cache.
    caches.match(event.request)
      .then(response => {
        // If a response is found in the cache, return it.
        if (response) {
          return response;
        }
        // If the request is not in the cache, fetch it from the network.
        return fetch(event.request);
      }
    )
  );
});
