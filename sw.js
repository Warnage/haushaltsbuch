/* Service Worker: cached alle App-Dateien, damit die App offline startet.
   Strategie:
   - index.html (Navigation): network-first – online kommen Updates sofort an,
     offline wird die gecachte Version geliefert. Der Cache wird bei jedem
     erfolgreichen Abruf aktualisiert.
   - Icons/Manifest: cache-first. Aendern sich diese Dateien (oder der SW selbst),
     die Versionsnummer hochzaehlen, damit der neue Cache installiert wird. */
const CACHE_NAME = "haushaltsbuch-v6";
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

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;

  // Seite selbst: erst Netz (frische Version + Cache-Update), offline aus dem Cache
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE_NAME).then(cache => cache.put("./index.html", copy));
        return resp;
      }).catch(() =>
        caches.match("./index.html")
      )
    );
    return;
  }

  // Alles andere (Icons, Manifest): cache-first
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request))
  );
});
