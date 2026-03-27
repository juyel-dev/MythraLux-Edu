/* MythraLux Edu — Service Worker */
const CACHE = 'mlx-edu-v1';
const SHELL = ['/', '/index.html', '/styles.css', '/main.js', '/profile.js', '/feedback.js', '/config.js', '/pwa/manifest.json'];

self.addEventListener('install',   e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate',  e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch',     e => {
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('docs.google.com') || e.request.url.includes('script.google.com')) return; // always fresh
  e.respondWith(caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
    if (res.ok) { const c = res.clone(); caches.open(CACHE).then(cache => cache.put(e.request, c)); }
    return res;
  }).catch(() => caches.match('/index.html'))));
});
