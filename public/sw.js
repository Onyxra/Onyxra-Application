/**
 * ONYXRA — sw.js (Service Worker)
 *
 * IMPORTANT: This SW intentionally does NOT cache the root HTML/Next.js routes
 * so that new deploys are picked up immediately. Only static assets are cached.
 *
 * On install: purges ALL old caches (kills old Koltyn OS cache too).
 */

const CACHE_NAME = 'onyxra-static-v2';
const FONT_CACHE = 'onyxra-fonts-v1';

const STATIC_ASSETS = [
  '/manifest.json',
  '/icons/icon-72.png',
  '/icons/icon-96.png',
  '/icons/icon-128.png',
  '/icons/icon-144.png',
  '/icons/icon-152.png',
  '/icons/icon-192.png',
  '/icons/icon-384.png',
  '/icons/icon-512.png',
];

/* ── Install: pre-cache static assets + purge ALL old caches ── */
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    // Purge ALL old caches (including old koltyn-os-* caches)
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
    // Cache static assets
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(STATIC_ASSETS);
    await self.skipWaiting();
  })());
});

/* ── Activate: claim clients immediately ── */
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter(k => k !== CACHE_NAME && k !== FONT_CACHE).map(k => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

/* ── Fetch router ── */
self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  /* HTML / Next.js routes: ALWAYS network-first, never serve cached HTML */
  if (request.destination === 'document' ||
      url.pathname === '/' ||
      url.pathname.startsWith('/login') ||
      url.pathname.startsWith('/api/') ||
      url.pathname.startsWith('/_next/')) {
    event.respondWith(fetch(request).catch(() => new Response('Offline', { status: 503 })));
    return;
  }

  /* Anthropic API — always network */
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

  /* Static assets — cache first */
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (response.ok && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});
