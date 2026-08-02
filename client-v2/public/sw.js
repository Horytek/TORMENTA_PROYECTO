/**
 * Service worker del POS: cachea el app shell EN TIEMPO DE EJECUCIÓN (no hay
 * manifest de precache — Vite hashea los nombres de archivo en cada build y
 * generar esa lista a mano quedaría desactualizada; para precache real con
 * manifest habría que sumar vite-plugin-pwa).
 * ponytail: cache-first "vas construyéndolo mientras navegas" cubre "abrir
 * el POS sin internet después de haberlo abierto una vez online" — si se
 * necesita que funcione en la PRIMERA visita sin conexión, hace falta
 * precache real (vite-plugin-pwa) como upgrade path.
 *
 * `/api/*` nunca se cachea: son datos de tenant, tienen que ser siempre
 * frescos o fallar explícitamente (el manejo de "sin conexión" para ventas
 * vive en la cola de IndexedDB, no acá — ver src/lib/offlineOutbox.ts).
 */

const CACHE_NAME = "horytek-shell-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  // Navegación (recargar/abrir la SPA): red primero, con el shell cacheado
  // como respaldo para cuando no hay internet.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          caches.open(CACHE_NAME).then((cache) => cache.put(request, res.clone()));
          return res;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("/index.html")))
    );
    return;
  }

  // Assets estáticos (JS/CSS/íconos): cache-first, se rellena solo con lo que se va pidiendo.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((res) => {
        if (res.ok) caches.open(CACHE_NAME).then((cache) => cache.put(request, res.clone()));
        return res;
      });
    })
  );
});
