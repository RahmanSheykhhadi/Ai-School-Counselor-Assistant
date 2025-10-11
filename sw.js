const CACHE_NAME = 'counselor-app-cache-v1';
const URLS_TO_CACHE = [
    '/',
    '/index.html',
    '/fonts.css',
    '/icon.svg'
];

const DB_NAME = 'CounselorAppDB';
const DB_VERSION = 8; // This must match the version in services/db.ts
const SETTINGS_STORE = 'settings';
const APP_SETTINGS_KEY = 'appSettings';

// Helper to open IndexedDB from the service worker.
function getDb() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => reject("Error opening DB in Service Worker");
        request.onsuccess = () => resolve(request.result);
        // The main app thread handles DB upgrades. The SW just needs to read.
    });
}

// Helper to get the appSettings object from IndexedDB.
async function getAppSettings() {
    try {
        const db = await getDb();
        return await new Promise((resolve, reject) => {
            const transaction = db.transaction(SETTINGS_STORE, 'readonly');
            const store = transaction.objectStore(SETTINGS_STORE);
            const request = store.get(APP_SETTINGS_KEY);
            request.onerror = () => reject('Error reading settings from DB');
            request.onsuccess = () => {
                // Provide a minimal default if settings are not found
                const defaultSettings = { appIcon: '' };
                resolve(request.result || defaultSettings);
            };
        });
    } catch (e) {
        console.error("Service Worker failed to get settings from IndexedDB:", e);
        // Fallback to default settings in case of any error
        return { appIcon: '' };
    }
}

async function dataUrlToResponse(dataUrl) {
  if (!dataUrl || !dataUrl.startsWith('data:')) {
    // Fallback to fetching the default static icon if no custom one is set
    return fetch('/icon.svg');
  }
  try {
    // The fetch API can directly handle data URLs, converting them to a proper Response object
    const response = await fetch(dataUrl);
    return response;
  } catch (e) {
    console.error('Failed to convert data URL to Response:', e);
    return fetch('/icon.svg'); // Fallback on error
  }
}

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(URLS_TO_CACHE);
            })
    );
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Handle dynamic icon requests
    if (url.pathname === '/app-icon-192.png' || url.pathname === '/app-icon-512.png') {
      event.respondWith(
        (async () => {
          const appSettings = await getAppSettings();
          // The response will have the correct content-type header from the data URL
          return dataUrlToResponse(appSettings.appIcon);
        })()
      );
      return; // Prevent falling through to other logic
    }

    // Intercept requests for manifest.json to generate it dynamically.
    if (url.pathname === '/manifest.json') {
        event.respondWith(
            (async () => {
                const manifest = {
                    name: "همیار مشاور هوشمند",
                    short_name: "همیار مشاور",
                    description: "یک برنامه جامع برای مدیریت جلسات مشاوره مدرسه با قابلیت‌های هوشمند.",
                    start_url: "/",
                    display: "standalone",
                    background_color: "#f1f5f9",
                    theme_color: "#0ea5e9",
                    icons: [
                        { "src": "/app-icon-192.png", "sizes": "192x192", "purpose": "any maskable" },
                        { "src": "/app-icon-512.png", "sizes": "512x512", "purpose": "any maskable" }
                    ]
                };

                return new Response(JSON.stringify(manifest), {
                    headers: { 'Content-Type': 'application/json' }
                });
            })()
        );
    } else if (event.request.method === 'GET') {
        // Cache-first, with network fallback and dynamic caching for all GET requests.
        // This ensures the app works offline after the first visit.
        event.respondWith(
            caches.open(CACHE_NAME).then(cache => {
                return cache.match(event.request).then(cachedResponse => {
                    const fetchPromise = fetch(event.request).then(networkResponse => {
                        // Only cache successful responses from http/https protocols
                        if (networkResponse.ok && event.request.url.startsWith('http')) {
                            cache.put(event.request, networkResponse.clone());
                        }
                        return networkResponse;
                    });
                    // Return cached response immediately if available, otherwise wait for network.
                    return cachedResponse || fetchPromise;
                });
            })
        );
    }
});