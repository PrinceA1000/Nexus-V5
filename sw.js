// sw.js - Advanced request interception for network proxy bypass
const PROXY_CHAIN = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?quest=',
  'https://thingproxy.freeboard.io/fetch/'
];

self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  
  // Skip our own files and non-network requests
  if (url.includes(self.location.origin) || url.startsWith('blob:')) return;
  
  // Only intercept navigation and resource requests
  if (event.request.mode !== 'navigate' && !/\.(html?|css|js|png|jpg|gif|svg|webp|woff2?|ttf|eot|mp4|webm|mp3)/i.test(url)) {
    return;
  }
  
  event.respondWith((async () => {
    // Try proxy chain
    for (const base of PROXY_CHAIN) {
      try {
        const proxyUrl = base + encodeURIComponent(url);
        const response = await fetch(proxyUrl, {
          method: 'GET',
          headers: { 
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          cache: 'no-store'
        });
        if (response.ok) return response;
      } catch (e) {
        continue;
      }
    }
    // Fallback to direct fetch
    return fetch(event.request);
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});