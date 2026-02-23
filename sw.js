// KidsOS Service Worker — PWA offline support
const CACHE_NAME = 'kidsOS-v3';

const ASSETS = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './icons/icon.svg',
  './config.js',
  './js/os.js',
  './js/apps/calculator.js',
  './js/apps/notepad.js',
  './js/apps/filemanager.js',
  './js/apps/paint.js',
  './js/apps/snake.js',
  './js/apps/memory.js',
  './js/apps/kidstagram.js',
  './js/apps/chat.js',
  './js/apps/minesweeper.js',
  './js/apps/ejob.js',
  './js/apps/tinybank.js',
  './js/apps/chorequest.js',
  './js/apps/treasuremapper.js',
  './js/apps/snackdash.js',
  './js/apps/kidflix.js',
  './js/apps/zoomer.js',
  './js/apps/soundboard.js',
  './js/apps/tinyscanner.js',
  './js/apps/sillyskies.js',
  './js/apps/breakout.js',
  './js/apps/captaincardio.js',
  './js/apps/pebbles.js',
  './js/apps/settings.js',
  './version.json',
];

// Install: cache app assets with cache:'reload' to bypass browser HTTP cache
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.all(
        ASSETS.map(url =>
          fetch(url, { cache: 'reload' })
            .then(res => {
              if (res && res.status === 200) return cache.put(url, res);
            })
            .catch(err => console.warn('SW: failed to cache', url, err))
        )
      )
    ).then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Listen for skip-waiting message from the app (used by Settings > Updates)
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

// Fetch: serve from cache, fall back to network, then update cache
self.addEventListener('fetch', e => {
  // Only handle same-origin GET requests over http(s)
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith('http')) return;

  // Network-first for version.json so update checks always get fresh data
  if (e.request.url.includes('version.json')) {
    e.respondWith(
      fetch(e.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      // Return cached version immediately, but also fetch update in background
      const fetchPromise = fetch(e.request).then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => cached); // If network fails, we already have cached

      return cached || fetchPromise;
    })
  );
});
