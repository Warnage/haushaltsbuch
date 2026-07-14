/* Service Worker: cached alle App-Dateien, damit die App offline startet.
   Bei jeder Änderung an index.html o. Ä. die Versionsnummer hochzählen –
   nur dann wird der neue Cache installiert und der alte aufgeräumt. */
const CACHE_NAME = "haushaltsbuch-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Cache-first: erst aus dem Cache antworten, nur bei Fehltreffer ins Netz.
   Navigationsanfragen fallen offline immer auf die gecachte index.html zurück. */
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit =>
      hit || fetch(e.request).catch(() => {
        if (e.request.mode === "navigate") return caches.match("./index.html");
      })
    )
  );
});
