// Crown Nexus Browser — Service Worker v4.0
const CACHE_NAME = 'crown-nexus-v4';
const ASSET_CACHE = 'crown-nexus-assets-v4';
const PROXY_CHAIN = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?quest=',
  'https://thingproxy.freeboard.io/fetch/'
];

// Patterns for assets that should be cached aggressively
const ASSET_PATTERNS = /\.(html?|css|js|png|jpg|jpeg|gif|svg|webp|woff2?|ttf|eot|mp4|webm|mp3|json)$/i;

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(['./index.html', './manifest.json']).catch(() => {}))
    .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME && k !== ASSET_CACHE)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Serve own files from cache first
  if (url.includes(self.location.origin)) {
    event.respondWith(
      caches.match(event.request)
        .then(cached => cached || fetch(event.request).then(res => {
          if (res.ok && ASSET_PATTERNS.test(url)) {
            caches.open(ASSET_CACHE).then(cache => cache.put(event.request, res.clone()));
          }
          return res;
        }))
        .catch(() => new Response('Offline - Asset not cached', { status: 503 }))
    );
    return;
  }

  // Skip blob, data URLs, and request types we don't proxy
  if (url.startsWith('blob:') || url.startsWith('data:')) return;

  // Proxy external requests
  if (event.request.mode === 'navigate' || ASSET_PATTERNS.test(url)) {
    event.respondWith(
      (async () => {
        for (const base of PROXY_CHAIN) {
          try {
            const proxyUrl = base + encodeURIComponent(url);
            const res = await fetch(proxyUrl, {
              headers: { 'Accept': 'text/html,application/xhtml+xml,*/*;q=0.9' },
              cache: 'no-store',
              signal: AbortSignal.timeout(10000),
              mode: 'cors'
            });
            if (res.ok) {
              if (ASSET_PATTERNS.test(url)) {
                caches.open(ASSET_CACHE).then(c => c.put(url, res.clone()));
              }
              return res;
            }
          } catch (e) {
            console.warn(`Proxy ${base} failed:`, e.message);
            continue;
          }
        }
        // Fallback: try direct fetch
        try {
          return await fetch(event.request);
        } catch {
          return new Response('Unable to fetch resource', { status: 503 });
        }
      })()
    );
  }
});