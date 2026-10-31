/* دنیای رسا ۲.۰ — offline cache */
const CACHE = 'rasa-baby-v2-1';
const CORE = [
  './', 'index.html', 'manifest.webmanifest',
  'assets/css/app.css', 'assets/js/data.js', 'assets/js/app.js', 'assets/js/games.js',
  'assets/fonts/Vazirmatn-var.woff2',
  'assets/icons/favicon.svg', 'assets/icons/icon-192.png', 'assets/icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  // images/audio/video: cache-first (large, static)
  if (/\.(webp|png|jpg|mp3|mp4|woff2|svg)$/.test(url.pathname)) {
    e.respondWith(caches.open(CACHE).then(async (c) => {
      const hit = await c.match(req);
      if (hit) return hit;
      try { const res = await fetch(req); if (res.ok) c.put(req, res.clone()); return res; }
      catch (err) { return hit || Response.error(); }
    }));
    return;
  }
  // shell: network-first, fallback to cache
  e.respondWith((async () => {
    try {
      const fresh = await fetch(req);
      const c = await caches.open(CACHE);
      if (fresh.ok) c.put(req, fresh.clone());
      return fresh;
    } catch (err) {
      const hit = await caches.match(req);
      return hit || (await caches.match('index.html')) || Response.error();
    }
  })());
});
