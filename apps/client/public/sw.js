/* PGG Marketing Field App service worker.
 * - App shell + pages: network first, falling back to the cache, then /offline.
 * - Next.js build assets (/_next/static): cache first (file names are hashed).
 * - Other same-origin GETs (icons, images, fonts): stale-while-revalidate.
 * - API (/app/*) and uploads (/uploads/*) are never cached: they carry client data.
 * Bump VERSION to drop old caches on the next deploy.
 */
const VERSION = 'v1';
const SHELL_CACHE = `pgg-shell-${VERSION}`;
const STATIC_CACHE = `pgg-static-${VERSION}`;
const PAGE_CACHE = `pgg-pages-${VERSION}`;
const OFFLINE_URL = '/offline.html';

const PRECACHE = [
  OFFLINE_URL,
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(PRECACHE)));
});

self.addEventListener('activate', (event) => {
  const keep = [SHELL_CACHE, STATIC_CACHE, PAGE_CACHE];
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('pgg-') && !keep.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// The page asks a waiting worker to take over once the officer taps "Update".
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/app/') || url.pathname.startsWith('/uploads/')) return;
  if (url.pathname === '/sw.js') return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, PAGE_CACHE, OFFLINE_URL));
  } else if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  } else if (url.searchParams.has('_rsc') || request.headers.get('RSC') === '1') {
    // Client-side navigation payloads
    event.respondWith(networkFirst(request, PAGE_CACHE));
  } else {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
  }
});

async function networkFirst(request, cacheName, fallbackUrl) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    const cached = await cache.match(request, { ignoreVary: true });
    if (cached) return cached;
    if (fallbackUrl) {
      const fallback = await caches.match(fallbackUrl);
      if (fallback) return fallback;
    }
    throw err;
  }
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) (await caches.open(cacheName)).put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached || network;
}

// ─── Push notifications (ready for when the server sends Web Push) ───

self.addEventListener('push', (event) => {
  if (!event.data) return;
  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: 'PGG Field App', body: event.data.text() };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'PGG Field App', {
      body: data.body,
      icon: data.icon || '/icons/icon-192.png',
      badge: '/icons/badge-96.png',
      vibrate: [100, 50, 100],
      data: { url: data.url || '/notifications' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || '/', self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const open = windows.find((w) => w.url.startsWith(self.location.origin));
      if (open) {
        open.navigate(target);
        return open.focus();
      }
      return self.clients.openWindow(target);
    }),
  );
});
