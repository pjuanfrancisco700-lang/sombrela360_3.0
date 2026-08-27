const CACHE = "sombrela360-v3.0.24";

const STATIC = [
  "./",
  "./index.html",
  "./styles.css?v=3.0.14",
  "./config.js",
  "./app.js?v=3.0.24",
  "./manifest.json",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/background-app.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(STATIC))
  );

  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE)
          .map(key => caches.delete(key))
      )
    )
  );

  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);

  if (
    event.request.method !== "GET" ||
    url.hostname.includes("script.google.com") ||
    url.hostname.includes("googleusercontent.com")
  ) {
    return;
  }

  // Navegación: primero internet, luego caché
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();

          caches.open(CACHE).then(cache => {
            cache.put("./index.html", clone);
          });

          return response;
        })
        .catch(() => caches.match("./index.html"))
    );

    return;
  }

  // Archivos de la app: primero internet.
  // Si no hay conexión, usar la copia almacenada.
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();

          caches.open(CACHE).then(cache => {
            cache.put(event.request, clone);
          });
        }

        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
