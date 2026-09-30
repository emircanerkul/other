/**
 * php-playground service worker.
 *
 * Caches the WebAssembly PHP runtime (~44 MB of hashed, immutable assets:
 * php_7_4-*.wasm, icu-*.dat, chunk-*.mjs …) plus the app files, so the base
 * runtime is downloaded once per browser and reused across visits and across
 * project switches. Hashed assets are cache-first (they never change under
 * the same name); everything else (playground.mjs, index.html, apps.json,
 * manifests) is network-first with cache fallback so deploys take effect
 * immediately and the playground still works offline.
 */
const CACHE = 'php-playground-v2';
self.addEventListener('message', (e) => { if (e.data?.type === 'SKIP_WAITING') self.skipWaiting(); });
// content-hashed, immutable build outputs
const IMMUTABLE = /-[A-Za-z0-9]{8}\.(mjs|wasm|dat)$/;

self.addEventListener('install', (event) => {
  // Precache the hashed runtime assets at install — Chrome serves module
  // scripts and wasm loads from its own HTTP cache and never fires the SW
  // fetch handler for them, so they must be seeded here explicitly.
  event.waitUntil((async () => {
    try {
      const res = await fetch('assets.json', { cache: 'no-store' });
      const assets = await res.json();
      const cache = await caches.open(CACHE);
      await Promise.all(assets.map(async (a) => {
        const req = new Request(a, { cache: 'no-store' });
        const hit = await cache.match(req);
        if (hit) return;
        const r = await fetch(req);
        if (r && r.ok) await cache.put(req, r.clone());
      }));
} catch (e) { /* assets.json missing (older bundle) — nothing to precache */ }
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.includes('/php-playground/')) return;

  if (IMMUTABLE.test(url.pathname)) event.respondWith(cacheFirst(req));
  else event.respondWith(networkFirst(req));
});

async function cacheFirst(req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res && res.ok && res.status === 200) {
    try { await cache.put(req, res.clone()); } catch { /* uncacheable */ }
  }
  return res;
}

async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(req);
    // 206 Partial (range requests) and opaque responses cannot go into a
    // Cache — cache.put would throw and reject the whole respondWith,
    // failing the resource. Just return them uncached.
    if (res && res.ok && res.status === 200) {
      try { await cache.put(req, res.clone()); } catch { /* uncacheable */ }
    }
    return res;
  } catch (err) {
    const hit = await cache.match(req);
    if (hit) return hit;
    throw err;
  }
}
