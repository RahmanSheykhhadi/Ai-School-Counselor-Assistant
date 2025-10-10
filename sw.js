const CACHE_NAME = 'counselor-app-cache-v1';
const URLS_TO_CACHE = [
    '/',
    '/index.html',
    '/fonts.css',
    '/sca-help.html'
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

    // Intercept requests for manifest.json to generate it dynamically.
    if (url.pathname === '/manifest.json') {
        event.respondWith(
            (async () => {
                const appSettings = await getAppSettings();
                const iconUrl = appSettings.appIcon;

                const manifest = {
                    name: "همیار مشاور هوشمند",
                    short_name: "همیار مشاور",
                    description: "یک برنامه جامع برای مدیریت جلسات مشاوره مدرسه با قابلیت‌های هوشمند.",
                    start_url: "/",
                    display: "standalone",
                    background_color: "#f1f5f9",
                    theme_color: "#0ea5e9",
                    icons: []
                };

                if (iconUrl && (iconUrl.startsWith('/') || iconUrl.startsWith('data:'))) {
                    let mimeType = 'image/png';
                    if (iconUrl.startsWith('data:')) {
                        mimeType = iconUrl.match(/data:([^;]+);/)?.[1] || 'image/png';
                    } else if (iconUrl.endsWith('.svg')) {
                        mimeType = 'image/svg+xml';
                    }

                    manifest.icons = [
                        { src: iconUrl, sizes: "192x192", type: mimeType, purpose: "any maskable" },
                        { src: iconUrl, sizes: "512x512", type: mimeType, purpose: "any maskable" }
                    ];
                }

                return new Response(JSON.stringify(manifest), {
                    headers: { 'Content-Type': 'application/json' }
                });
            })()
        );
    } else {
        // For all other requests, use a cache-first strategy.
        event.respondWith(
            caches.match(event.request)
                .then(response => {
                    return response || fetch(event.request);
                })
        );
    }
});