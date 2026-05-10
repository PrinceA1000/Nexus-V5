// Crown Browser — Service Worker v3.1
const CACHE_NAME = 'crown-v3.1';
const PROXY_CHAIN = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?quest=',
  'https://thingproxy.freeboard.io/fetch/',
  'https://proxy.crown-browser.dev/fetch?url='
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(['./index.html', './manifest.json'])
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = event.request.url;
  
  // Serve own files from cache
  if (url.includes(self.location.origin)) {
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request))
    );
    return;
  }
  
  // Skip blob/data URLs and non-navigation
  if (url.startsWith('blob:') || url.startsWith('data:')) return;
  if (event.request.mode !== 'navigate' && !/\.(html?|css|js|png|jpg|gif|svg|webp|woff2?|ttf|eot|mp4|webm|mp3)/i.test(url)) return;
  
  // Proxy navigation/resource requests
  event.respondWith(
    (async () => {
      for (const base of PROXY_CHAIN) {
        try {
          const proxyUrl = base + encodeURIComponent(url);
          const res = await fetch(proxyUrl, {
            headers: { 'Accept': 'text/html,application/xhtml+xml,*/*' },
            cache: 'no-store',
            signal: AbortSignal.timeout(8000)
          });
          if (res.ok) return res;
        } catch { continue; }
      }
      return fetch(event.request);
    })()
  );
});