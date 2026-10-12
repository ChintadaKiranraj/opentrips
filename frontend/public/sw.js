/**
 * Minimal offline cache for previously visited saved-plan pages (B5).
 *
 * Scope is deliberately narrow: only GET navigations under /plans/ and the
 * Next.js static assets they need. Network-first, falling back to the
 * cache when there's no connection, this is what makes "works with no
 * signal on the trail" true for a plan you already opened once, rather
 * than an unverified claim.
 */
const CACHE_NAME = "opentrips-plans-v1";
const CACHEABLE_PREFIXES = ["/plans/", "/_next/"];

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

function isCacheable(url) {
  return CACHEABLE_PREFIXES.some((prefix) => url.pathname.startsWith(prefix));
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (!isCacheable(url)) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      try {
        const response = await fetch(request);
        if (response && response.ok) {
          cache.put(request, response.clone());
        }
        return response;
      } catch (err) {
        const cached = await cache.match(request);
        if (cached) return cached;
        throw err;
      }
    }),
  );
});
