const VERSION = 'mozg-site-mozg-v10';
const HOME_PATH = '/';
const APP_SHELL = [
  '/',
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
  '/data/site-operations.json',
  '/data/site-journeys.json',
  '/data/site-trust.json',
  '/llms.txt',
  '/robots.txt',
  '/openapi/',
  '/docs/',
  '/swagger-ui.html',
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
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            event.waitUntil(
              caches.open(VERSION).then((cache) => {
                cache.put(HOME_PATH, responseClone);
              }),
            );
          }
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(VERSION);
          return cache.match(HOME_PATH) || Response.error();
        }),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            event.waitUntil(
              caches.open(VERSION).then((cache) => {
                cache.put(event.request, responseClone);
              }),
            );
          }
          return response;
        })
        .catch(() => cachedResponse || Response.error());

      return cachedResponse || networkFetch;
    }),
  );
});
