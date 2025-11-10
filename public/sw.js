const APP_VERSION = '__APP_VERSION__';
const CACHE_NAME = `pratica-eng-${APP_VERSION}`;
const STATIC_CACHE = `pratica-eng-static-${APP_VERSION}`;
const RUNTIME_CACHE = `pratica-eng-runtime-${APP_VERSION}`;

const STATIC_ASSETS = [
  '/manifest.json',
  '/icon.svg',
  '/icon-192.svg',
  '/icon-512.svg'
];

const CACHE_STRATEGIES = {
  networkFirst: ['/', '/index.html'],
  cacheFirst: STATIC_ASSETS,
  networkOnly: ['/api/']
};

self.addEventListener('install', (event) => {
  console.log(`[SW] Installing version ${APP_VERSION}`);

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch((error) => {
        console.error('[SW] Install failed:', error);
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log(`[SW] Activating version ${APP_VERSION}`);

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName.startsWith('pratica-eng-') &&
                cacheName !== CACHE_NAME &&
                cacheName !== STATIC_CACHE &&
                cacheName !== RUNTIME_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
      .then(() => {
        return self.clients.matchAll();
      })
      .then((clients) => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_UPDATED',
            version: APP_VERSION
          });
        });
      })
  );
});

function isNetworkFirst(url) {
  return CACHE_STRATEGIES.networkFirst.some(pattern => url.pathname === pattern);
}

function isCacheFirst(url) {
  return CACHE_STRATEGIES.cacheFirst.some(pattern => url.pathname.includes(pattern));
}

function isNetworkOnly(url) {
  return CACHE_STRATEGIES.networkOnly.some(pattern => url.pathname.includes(pattern));
}

async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Network first failed, trying cache:', error);
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    if (request.destination === 'document') {
      return caches.match('/index.html');
    }

    throw error;
  }
}

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache first failed:', error);
    throw error;
  }
}

async function networkOnly(request) {
  return fetch(request);
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== 'GET') {
    return;
  }

  if (url.origin !== self.location.origin) {
    return;
  }

  if (isNetworkOnly(url)) {
    event.respondWith(networkOnly(event.request));
  } else if (isNetworkFirst(url)) {
    event.respondWith(networkFirst(event.request));
  } else if (isCacheFirst(url)) {
    event.respondWith(cacheFirst(event.request));
  } else {
    event.respondWith(networkFirst(event.request));
  }
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
