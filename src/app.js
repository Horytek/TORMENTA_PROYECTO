// index.js
import express from "express";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import { FRONTEND_URL } from "./config.js";
// import { auditLog } from "./middlewares/audit.middleware.js";
import { startLogMaintenance } from "./services/logMaintenance.service.js";

/* ────────────────────────────────────────────────────────────────────────────
   Utilidades
   ──────────────────────────────────────────────────────────────────────────── */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const env = process.env.NODE_ENV || "production";
const port = Number(process.env.PORT || process.env.WEBSITES_PORT || 8080);

/** Devuelve true si el string es una URL absoluta http(s) */
function isHttpUrl(str) {
  return typeof str === "string" && /^https?:\/\//i.test(str.trim());
}

/** Normaliza argumentos de rutas: si llega una URL, usa su pathname; asegura "/" inicial. */
function normalizeRouteArg(arg) {
  // String
  if (typeof arg === "string") {
    const s = arg.trim();
    if (isHttpUrl(s)) {
      try {
        const u = new URL(s);
        const pathname = u.pathname || "/";
        console.warn(
          `⚠️  Se detectó URL usada como ruta ("${s}"). ` +
          `Se usará su pathname "${pathname}".`
        );
        return pathname;
      } catch {
        throw new Error(`Ruta inválida (no convertible a path): "${s}"`);
      }
    }
    return s.startsWith("/") ? s : `/${s}`;
  }
  // Array de strings/regex
  if (Array.isArray(arg)) {
    return arg.map((x) => normalizeRouteArg(x));
  }
  // RegExp u otros tipos: los devolvemos tal cual
  return arg;
}

/** Envuelve métodos de registro de rutas para validar/normalizar el primer argumento */
function patchRegisterMethods(target, label = "router/app") {
  const methods = ["use", "get", "post", "put", "delete", "patch", "options", "all"];
  for (const m of methods) {
    if (typeof target[m] !== "function") continue;
    const orig = target[m].bind(target);
    target[m] = (...args) => {
      if (args.length > 0) {
        args[0] = normalizeRouteArg(args[0]);
      }
      try {
        return orig(...args);
      } catch (err) {
        console.error(`❌ Error registrando ruta en ${label}.${m}:`, err?.message || err);
        throw err;
      }
    };
  }
}

/** Parchea express.Router para que **todos** los routers creados queden protegidos */
function patchExpressRouter(expressModule) {
  const originalRouterFactory = expressModule.Router;
  expressModule.Router = function patchedRouter(...args) {
    const router = originalRouterFactory.apply(this, args);
    patchRegisterMethods(router, "Router");
    return router;
  };
}

/* ────────────────────────────────────────────────────────────────────────────
   Aplicación
   ──────────────────────────────────────────────────────────────────────────── */
const app = express();

// Parcheos ANTES de cargar módulos de rutas
patchRegisterMethods(app, "App");
patchExpressRouter(express);

// Logs básicos
console.log(`🚀 Servidor iniciando en puerto ${port}`);
console.log(`🌍 Entorno: ${env}`);

// CORS: permite FRONTEND_URL + localhost/LAN
function onlyOrigin(urlLike) {
  if (!urlLike) return null;
  try {
    const u = new URL(urlLike);
    return `${u.protocol}//${u.host}`;
  } catch {
    return null;
  }
}
const allowedOrigins = new Set(
  [FRONTEND_URL, process.env.FRONTEND_URL, process.env.APPSETTING_FRONTEND_URL]
    .map(onlyOrigin)
    .filter(Boolean)
);

console.log(`🔗 Frontend URL: ${FRONTEND_URL}`);
console.log(`🔗 Frontend ORIGIN (solo CORS): ${[...allowedOrigins].join(", ") || "(none)"}`);

const allowedOrigin = (origin, callback) => {
  if (!origin) return callback(null, true); // Postman/curl/native apps
  if (allowedOrigins.has(origin)) return callback(null, true);
  if (/^http:\/\/localhost(:\d+)?$/.test(origin)) return callback(null, true);
  if (/^http:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(origin)) return callback(null, true);
  return callback(new Error("Not allowed by CORS"));
};

// Middlewares
app.use(morgan("dev"));
app.use(
  cors({
    origin: allowedOrigin,
    methods: "GET,POST,PUT,DELETE,OPTIONS",
    credentials: true,
  })
);
// Preflight
app.options(
  "*",
  cors({
    origin: allowedOrigin,
    methods: "GET,POST,PUT,DELETE,OPTIONS",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());
// app.use(auditLog()); // si lo reactivas, colócalo después de auth para no llenar logs

/* ────────────────────────────────────────────────────────────────────────────
   Carga de rutas (dinámica, después de parchear Router)
   ──────────────────────────────────────────────────────────────────────────── */
async function mountRoutes() {
  const table = [
    ["/api/dashboard", "./routes/dashboard.routes.js"],
    ["/api/reporte", "./routes/reporte.routes.js"],
    ["/api/auth", "./routes/auth.routes.js"],
    ["/api/usuario", "./routes/usuarios.routes.js"],
    ["/api/rol", "./routes/rol.routes.js"],
    ["/api/productos", "./routes/productos.routes.js"],
    ["/api/ventas", "./routes/ventas.routes.js"],
    ["/api/marcas", "./routes/marcas.routes.js"],
    ["/api/nota_ingreso", "./routes/notaingreso.routes.js"],
    ["/api/nota_salida", "./routes/notasalida.routes.js"],
    ["/api/kardex", "./routes/kardex.routes.js"],
    ["/api/guia_remision", "./routes/guiaremision.routes.js"],
    ["/api/categorias", "./routes/categoria.routes.js"],
    ["/api/subcategorias", "./routes/subcategoria.routes.js"],
    ["/api/destinatario", "./routes/destinatario.routes.js"],
    ["/api/vendedores", "./routes/vendedores.routes.js"],
    ["/api/sucursales", "./routes/sucursal.routes.js"],
    ["/api/almacen", "./routes/almacen.routes.js"],
    ["/api/funciones", "./routes/funciones.routes.js"],
    ["/api/planes", "./routes/plan_pago.routes.js"],
    ["/api/clientes", "./routes/clientes.routes.js"],
    ["/api/modulos", "./routes/modulos.routes.js"],
    ["/api/submodulos", "./routes/submodulos.routes.js"],
    ["/api/permisos", "./routes/permisos.routes.js"],
    ["/api/permisos-globales", "./routes/permisosGlobales.routes.js"],
    ["/api/rutas", "./routes/rutas.routes.js"],
    ["/api/empresa", "./routes/empresa.routes.js"],
    ["/api/clave", "./routes/clave.routes.js"],
    ["/api/logotipo", "./routes/logotipo.routes.js"],
    ["/api/valor", "./routes/valor.routes.js"],
    ["/api/logs", "./routes/logs.routes.js"],
  ];

  for (const [base, modPath] of table) {
    try {
      const mod = await import(modPath);
      const router = mod?.default ?? mod;
      app.use(base, router);
      console.log(`✅ Ruta montada: ${base} <- ${modPath}`);
    } catch (err) {
      console.error(`❌ Error importando/montando ${modPath}:`, err?.message || err);
      // Si prefieres que falle duro, vuelve a lanzar:
      // throw err;
    }
  }
}

await mountRoutes();

/* ────────────────────────────────────────────────────────────────────────────
   Frontend estático (SPA) y catch‑all seguro
   ──────────────────────────────────────────────────────────────────────────── */
app.use(express.static(path.join(__dirname, "../client/dist")));

// Cualquier GET que **no** empiece por /api sirve index.html
app.get(/^(?!\/api).*/, (req, res, next) => {
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});

/* ────────────────────────────────────────────────────────────────────────────
   Manejadores de error
   ──────────────────────────────────────────────────────────────────────────── */
app.use((err, _req, res, _next) => {
  console.error("💥 Error en middleware/ruta:", err?.stack || err);
  const status = typeof err?.status === "number" ? err.status : 500;
  res.status(status).json({
    ok: false,
    message:
      err?.message ||
      "Error interno del servidor. Revisa los logs para más detalles.",
  });
});

/* ────────────────────────────────────────────────────────────────────────────
   Arranque
   ──────────────────────────────────────────────────────────────────────────── */
function start() {
  // Para cookies "secure" detrás de Azure/NGINX si usas proxies:
  app.set("trust proxy", 1);

  const server = app.listen(port, "0.0.0.0", () => {
    console.log(`✅ Escuchando en http://0.0.0.0:${port}`);
  });

  try {
    startLogMaintenance();
  } catch (e) {
    console.error("⚠️  No se pudo iniciar el mantenimiento de logs:", e?.message || e);
  }

  // Manejo de señales (shutdown limpio)
  const shutdown = (sig) => () => {
    console.log(`🔻 Recibido ${sig}, cerrando servidor...`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on("SIGTERM", shutdown("SIGTERM"));
  process.on("SIGINT", shutdown("SIGINT"));
}

// Si este archivo es el entrypoint, arrancamos
if (import.meta.url === `file://${process.argv[1]}`) {
  start();
}

export default app;
