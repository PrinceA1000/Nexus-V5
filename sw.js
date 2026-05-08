// sw.js - Service Worker for request interception (Utopia-style)
const PROXY_ENDPOINTS = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?quest='
];

self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  
  // Only intercept fetches that look like navigation or resources
  if (event.request.mode !== 'navigate' && !/\.(html?|css|js|png|jpg|gif|svg|webp|woff2?|ttf|eot)/i.test(url)) {
    return;
  }
  
  // Skip our own files
  if (url.includes(self.location.origin)) return;
  
  // Try proxy chain
  event.respondWith((async () => {
    for (const base of PROXY_ENDPOINTS) {
      try {
        const proxyUrl = base + encodeURIComponent(url);
        const response = await fetch(proxyUrl, {
          method: 'GET',
          headers: { 'Accept': 'text/html,application/xhtml+xml,*/*' }
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