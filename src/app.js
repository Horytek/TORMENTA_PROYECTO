// index.js
import express from "express";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import { FRONTEND_URL } from "./config.js";
import { startLogMaintenance } from "./services/logMaintenance.service.js";

/* ────────── Utilidades ────────── */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const env = process.env.NODE_ENV || "production";
const port = Number(process.env.PORT || process.env.WEBSITES_PORT || 8080);

const isHttpUrl = (s) => typeof s === "string" && /^https?:\/\//i.test(s?.trim());

/** Si llega una URL como ruta, convierte a pathname; respeta '*' y patrones especiales */
function normalizeRouteArg(arg) {
  if (typeof arg === "string") {
    const s = arg.trim();
    // Mantén comodines típicos sin cambiar
    if (s === "*" || s === "/*" || s === "/" || s === "/(.*)" || s === "/(.*)?") return s;

    if (isHttpUrl(s)) {
      const u = new URL(s);
      let p = u.pathname || "/";
      if (!p.startsWith("/")) p = `/${p}`;
      console.warn(`⚠️  URL usada como ruta: "${s}". Usando solo pathname "${p}".`);
      return p;
    }
    // Asegura que empiece por "/"
    return s.startsWith("/") ? s : `/${s}`;
  }
  if (Array.isArray(arg)) return arg.map((x) => normalizeRouteArg(x));
  return arg; // RegExp o función, se deja tal cual
}

/** Parchea métodos de registro de rutas en app/router */
function patchRegisterMethods(target, label = "app") {
  const methods = ["use", "get", "post", "put", "delete", "patch", "options", "all"];
  for (const m of methods) {
    if (typeof target[m] !== "function") continue;
    const orig = target[m].bind(target);
    target[m] = (...args) => {
      if (args.length && (typeof args[0] === "string" || Array.isArray(args[0]))) {
        args[0] = normalizeRouteArg(args[0]);
      }
      try {
        return orig(...args);
      } catch (err) {
        const msg = err?.message || String(err);
        console.error(`❌ Error registrando ruta en ${label}.${m}: ${msg}`);
        if (msg.includes("Missing parameter name")) {
          console.error("🔍 Suele pasar si se usa una URL completa como path. Usa paths como '/api/...'.");
        }
        throw err;
      }
    };
  }
}

/** Parchea express.Router para proteger todos los routers creados */
function patchExpressRouter(expressModule) {
  const original = expressModule.Router;
  expressModule.Router = function patchedRouter(...args) {
    const router = original.apply(this, args);
    patchRegisterMethods(router, "router");
    return router;
  };
}

/* ────────── App ────────── */
const app = express();

// Parchear ANTES de montar rutas
patchRegisterMethods(app, "app");
patchExpressRouter(express);

// Logs básicos
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
  if (!origin) return cb(null, true); // Postman/curl/native apps
  if (allowedOrigins.has(origin)) return cb(null, true);
  if (/^http:\/\/localhost(:\d+)?$/.test(origin)) return cb(null, true);
  if (/^http:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(origin)) return cb(null, true);
  return cb(new Error("Not allowed by CORS"));
};

// Middlewares
app.use(morgan("dev"));
app.use(
  cors({
    origin: corsOrigin,
    methods: "GET,POST,PUT,DELETE,OPTIONS",
    credentials: true,
  })
);
// Preflight global (deja '*' tal cual)
app.options(
  "*",
  cors({
    origin: corsOrigin,
    methods: "GET,POST,PUT,DELETE,OPTIONS",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());
// import y uso de auditLog si corresponde, después de auth para no ensuciar logs
// app.use(auditLog());

/* ────────── Montaje de rutas ────────── */
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
    const mod = await import(modPath);
    const router = mod?.default ?? mod;
    app.use(base, router);
    console.log(`✅ Ruta montada: ${base} <- ${modPath}`);
  }
}
await mountRoutes();

/* ────────── Frontend estático (SPA) ────────── */
app.use(express.static(path.join(__dirname, "../client/dist")));
// Cualquier GET que NO empiece por /api, sirve index.html
app.get(/^(?!\/api).*/, (_req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});

/* ────────── Manejador de errores ────────── */
app.use((err, _req, res, _next) => {
  console.error("💥 Error:", err?.stack || err);
  const status = typeof err?.status === "number" ? err.status : 500;
  res.status(status).json({
    ok: false,
    message: err?.message || "Error interno del servidor",
  });
});

/* ────────── Arranque ────────── */
function start() {
  // Detrás de proxy (App Service) para cookies secure, IPs, etc.
  app.set("trust proxy", 1);

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
