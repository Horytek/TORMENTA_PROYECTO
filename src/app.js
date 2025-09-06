// index.js
import express from "express";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import { FRONTEND_URL } from "./config.js";
import { startLogMaintenance } from "./services/logMaintenance.service.js";

/* ───────── Utilidades ───────── */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const env = process.env.NODE_ENV || "production";
const port = Number(process.env.PORT || process.env.WEBSITES_PORT || 8080);

// Sanitizar BASE_PATH para evitar URLs completas
const sanitizeBasePath = (basePath) => {
  if (!basePath) return "/api";
  if (typeof basePath === "string" && basePath.startsWith("http")) {
    console.warn(`⚠️  BASE_PATH contiene URL completa: "${basePath}". Usando "/api" por seguridad.`);
    return "/api";
  }
  return basePath.startsWith("/") ? basePath : `/${basePath}`;
};

const BASE_PATH = sanitizeBasePath(process.env.BASE_PATH || "/api");

const isHttpUrl = (s) => typeof s === "string" && /^https?:\/\//i.test(s.trim());

/** Si llega una URL como path, usa su pathname; deja RegExp y '*' en paz */
function normalizeRouteArg(arg) {
  if (typeof arg === "string") {
    const s = arg.trim();
    // No tocar comodines/variantes típicas
    if (s === "*" || s === "/*" || s === "/" || s === "/(.*)" || s === "/(.*)?") return s;

    if (isHttpUrl(s)) {
      const u = new URL(s);
      let p = u.pathname || "/";
      if (!p.startsWith("/")) p = `/${p}`;
      console.warn(`⚠️  URL usada como ruta: "${s}". Usando pathname "${p}".`);
      return p;
    }
    return s.startsWith("/") ? s : `/${s}`;
  }
  if (Array.isArray(arg)) return arg.map((x) => normalizeRouteArg(x));
  return arg; // RegExp / funciones
}

/** Parchea métodos de registro (use/get/post/...) en app/router */
function patchRegisterMethods(target, label = "app") {
  const methods = ["use", "get", "post", "put", "delete", "patch", "options", "all"];
  for (const m of methods) {
    if (typeof target[m] !== "function") continue;
    const orig = target[m].bind(target);
    target[m] = (...args) => {
      try {
        if (args.length && (typeof args[0] === "string" || Array.isArray(args[0]))) {
          args[0] = normalizeRouteArg(args[0]);
        }
        return orig(...args);
      } catch (err) {
        const msg = err?.message || String(err);
        console.error(`❌ Error registrando ruta en ${label}.${m}: ${msg}`);
        if (msg.includes("Missing parameter name")) {
          console.error("🔍 Eso pasa cuando se usa una URL absoluta como path. Usa '/ruta' en lugar de 'https://...'.");
        }
        throw err;
      }
    };
  }
}

/** Parchea express.Router para cubrir todos los módulos de rutas */
function patchExpressRouter(expressModule) {
  const original = expressModule.Router;
  expressModule.Router = function patchedRouter(...args) {
    const router = original.apply(this, args);
    patchRegisterMethods(router, "router");
    return router;
  };
}

/* ───────── App ───────── */
const app = express();

// Configurar puerto para que index.js pueda accederlo
app.set('port', port);

// Parcheos ANTES de montar rutas
patchRegisterMethods(app, "app");
patchExpressRouter(express);

console.log(`🚀 Servidor iniciando en puerto ${port}`);
console.log(`🌍 Entorno: ${env}`);

// CORS
function onlyOrigin(urlLike) {
  try {
    if (!urlLike) return null;
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

const corsOrigin = (origin, cb) => {
  if (!origin) return cb(null, true); // Postman/curl/mobile
  if (allowedOrigins.has(origin)) return cb(null, true);
  if (/^http:\/\/localhost(:\d+)?$/.test(origin)) return cb(null, true);
  if (/^http:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(origin)) return cb(null, true);
  return cb(new Error("Not allowed by CORS"));
};

app.use(morgan("dev"));
app.use(
  cors({
    origin: corsOrigin,
    methods: "GET,POST,PUT,DELETE,OPTIONS",
    credentials: true,
  })
);
// Preflight global: usar RegExp evita rarezas con "*"
app.options("/api/*", cors({
  origin: corsOrigin,
  methods: "GET,POST,PUT,DELETE,OPTIONS",
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

/* ───────── Montaje de rutas ───────── */
async function mountRoutes() {
  const routes = [
    ["dashboard", "./routes/dashboard.routes.js"],
    ["reporte", "./routes/reporte.routes.js"],
    ["auth", "./routes/auth.routes.js"],
    ["usuario", "./routes/usuarios.routes.js"],
    ["rol", "./routes/rol.routes.js"],
    ["productos", "./routes/productos.routes.js"],
    ["ventas", "./routes/ventas.routes.js"],
    ["marcas", "./routes/marcas.routes.js"],
    ["nota_ingreso", "./routes/notaingreso.routes.js"],
    ["nota_salida", "./routes/notasalida.routes.js"],
    ["kardex", "./routes/kardex.routes.js"],
    ["guia_remision", "./routes/guiaremision.routes.js"],
    ["categorias", "./routes/categoria.routes.js"],
    ["subcategorias", "./routes/subcategoria.routes.js"],
    ["destinatario", "./routes/destinatario.routes.js"],
    ["vendedores", "./routes/vendedores.routes.js"],
    ["sucursales", "./routes/sucursal.routes.js"],
    ["almacen", "./routes/almacen.routes.js"],
    ["funciones", "./routes/funciones.routes.js"],
    ["planes", "./routes/plan_pago.routes.js"],
    ["clientes", "./routes/clientes.routes.js"],
    ["modulos", "./routes/modulos.routes.js"],
    ["submodulos", "./routes/submodulos.routes.js"],
    ["permisos", "./routes/permisos.routes.js"],
    ["permisos-globales", "./routes/permisosGlobales.routes.js"],
    ["rutas", "./routes/rutas.routes.js"],
    ["empresa", "./routes/empresa.routes.js"],
    ["clave", "./routes/clave.routes.js"],
    ["logotipo", "./routes/logotipo.routes.js"],
    ["valor", "./routes/valor.routes.js"],
    ["logs", "./routes/logs.routes.js"],
  ];

  for (const [segment, modPath] of routes) {
    const mod = await import(modPath);
    const router = mod?.default ?? mod;
    const base = path.posix.join(BASE_PATH, segment);
    app.use(base, router);
    console.log(`✅ Ruta montada: ${base} <- ${modPath}`);
  }
}
await mountRoutes();

/* ───────── Healthcheck rápido ───────── */
app.get("/__ping", (_req, res) => res.status(200).send("ok"));

/* ───────── Frontend (SPA) ───────── */
app.use(express.static(path.join(__dirname, "../client/dist")));
const escapedBase = BASE_PATH.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
app.get(new RegExp(`^(?!${escapedBase}).*`), (_req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});

/* ───────── Manejador de errores ───────── */
app.use((err, _req, res, _next) => {
  console.error("💥 Error:", err?.stack || err);
  const status = typeof err?.status === "number" ? err.status : 500;
  res.status(status).json({ ok: false, message: err?.message || "Error interno del servidor" });
});

/* ───────── Arranque ───────── */
function start() {
  app.set("trust proxy", 1); // detrás de App Service

  const server = app.listen(port, "0.0.0.0", () => {
    console.log(`✅ Escuchando en http://0.0.0.0:${port}`);
  });

  try {
    startLogMaintenance();
  } catch (e) {
    console.error("⚠️  No se pudo iniciar el mantenimiento de logs:", e?.message || e);
  }

  const shutdown = (sig) => () => {
    console.log(`🔻 Recibido ${sig}, cerrando servidor...`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on("SIGTERM", shutdown("SIGTERM"));
  process.on("SIGINT", shutdown("SIGINT"));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  start();
}

export default app;
