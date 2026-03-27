const VERSION = 'mozg-site-v8';
const APP_SHELL = [
  '/',
  '/openapi/',
  '/docs/',
  '/swagger-ui.html',
  '/manifest.json',
  '/logo-mini.svg',
  '/logo-mini.png',
  '/og.jpg',
  '/data/site-catalog.json',
  '/data/site-audit.json',
  '/data/site-discovery.json',
  '/data/site-portfolio.json',
  '/data/site-projects.json',
  '/data/site-capabilities.json',
  '/data/site-stacks.json',
  '/llms.txt',
  '/robots.txt',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => (key === VERSION ? null : caches.delete(key))),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cache = await caches.open(VERSION);
        return cache.match('/') || Response.error();
      }),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response.ok) {
            caches.open(VERSION).then((cache) => {
              cache.put(event.request, response.clone());
            });
          }
          return response;
        })
        .catch(() => cachedResponse || Response.error());

      return cachedResponse || networkFetch;
    }),
  );
});
