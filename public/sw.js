/**
 * KOLTYN OS — sw.js (Service Worker)
 *
 * Cache strategy:
 *   App shell  → Cache First (pre-cached on install)
 *   Fonts      → Cache First with network fallback
 *   Anthropic  → Network Only (never cache AI responses)
 */

const CACHE_NAME = 'koltyn-os-v6';
const FONT_CACHE = 'koltyn-fonts-v1';

const APP_SHELL = [
  '/',
  '/manifest.json',
  '/js/data.js',
  '/js/state.js',
  '/js/app.js',
  '/js/pages/dashboard.js',
  '/js/pages/nutrition.js',
  '/js/pages/workout.js',
  '/js/pages/business.js',
  '/js/pages/wealth.js',
  '/js/pages/passions.js',
  '/js/pages/settings.js',
  '/icons/icon-72.png',
  '/icons/icon-96.png',
  '/icons/icon-128.png',
  '/icons/icon-144.png',
  '/icons/icon-152.png',
  '/icons/icon-192.png',
  '/icons/icon-384.png',
  '/icons/icon-512.png',
];

/* ── Install: pre-cache everything ── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

/* ── Activate: purge old cache versions ── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME && k !== FONT_CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* ── Fetch router ── */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  /* Skip non-GET requests entirely */
  if (request.method !== 'GET') return;

  /* Anthropic API — always network, never cache */
  if (url.hostname === 'api.anthropic.com') {
    event.respondWith(fetch(request));
    return;
  }

  /* Google Fonts — cache with network fallback */
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open(FONT_CACHE).then(cache =>
        cache.match(request).then(cached => {
          if (cached) return cached;
          return fetch(request).then(response => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          }).catch(() => cached);
        })
      )
    );
    return;
  }

  /* App shell — cache first, network fallback, then offline fallback */
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (response.ok) {
          caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
        }
        return response;
      }).catch(() => {
        if (request.destination === 'document') {
          return caches.match('/');
        }
      });
    })
  );
});
