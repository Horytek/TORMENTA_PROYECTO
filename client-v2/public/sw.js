/**
 * Service worker del POS: mantiene el app shell disponible sin internet.
 *
 * Los assets de Vite vienen con hash en el nombre, así que son inmutables:
 * cache-first sobre ellos es correcto y además óptimo. La navegación va a red
 * primero para que un despliegue nuevo se vea de inmediato, con el shell
 * cacheado como respaldo cuando no hay conexión.
 *
 * `/api/*` nunca se cachea: son datos de tenant y devolver una respuesta vieja
 * como si fuera fresca es peor que fallar. El "sin conexión" de las ventas vive
 * en la cola de IndexedDB (`src/lib/offlineOutbox.ts`), y el catálogo que el POS
 * necesita para vender se guarda aparte con su fecha, para poder avisar de
 * cuándo es la foto.
 *
 * Solo se registra en producción (ver src/main.tsx): en desarrollo Vite sirve
 * módulos con URL sin hash y cache-first los congelaría, rompiendo el HMR.
 */

const CACHE_NAME = "horytek-shell-v2";
const SHELL = "/index.html";

self.addEventListener("install", (event) => {
  // Precachear el shell es lo que permite ABRIR el POS sin internet en una
  // ruta que nunca se visitó. Antes solo quedaba cacheada la URL exacta ya
  // navegada, así que entrar directo a /sales/pos sin conexión daba pantalla
  // en blanco — justo el escenario de la cajera que abre la app en la mañana.
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.add(SHELL))
      .catch(() => {}) // instalar sin red no debe abortar el registro
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/** Respuesta de último recurso: sin shell cacheado no hay nada que mostrar. */
const sinConexion = () =>
  new Response(
    "<!doctype html><meta charset=utf-8><title>Sin conexión</title>" +
      "<p style=\"font:16px system-ui;padding:2rem\">Sin conexión y sin copia local todavía. " +
      "Abre la aplicación una vez con internet para poder usarla offline.</p>",
    { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  // Navegación (abrir o recargar la SPA): red primero.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          // Se guarda TAMBIÉN bajo `/index.html`: es la copia que sirve para
          // cualquier ruta, no solo para la que se estaba visitando.
          if (res.ok) {
            const copia = res.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, copia.clone());
              cache.put(SHELL, copia);
            });
          }
          return res;
        })
        .catch(async () =>
          (await caches.match(request)) || (await caches.match(SHELL)) || sinConexion()
        )
    );
    return;
  }

  // Assets estáticos (JS/CSS/íconos): cache-first, se llena mientras se navega.
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((res) => {
          if (res.ok) {
            const copia = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copia));
          }
          return res;
        })
    )
  );
});
