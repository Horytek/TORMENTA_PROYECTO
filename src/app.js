import express, { Router } from "express";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";
import { FRONTEND_URL, FRONTEND_ORIGIN } from "./config.js";
import path from "path";
import { fileURLToPath } from "url";
//Rutas
import dashboardRoutes from "./routes/dashboard.routes.js";
import auhtRoutes from "./routes/auth.routes.js";
import usuariosRoutes from "./routes/usuarios.routes.js";
import rolRoutes from "./routes/rol.routes.js";
import productosRoutes from "./routes/productos.routes.js";
import ventasRoutes from "./routes/ventas.routes.js";
import marcasRoutes from "./routes/marcas.routes.js";
import ingresosRoutes from "./routes/notaingreso.routes.js";
import salidaRoutes from "./routes/notasalida.routes.js";
import kardexRoutes from "./routes/kardex.routes.js";
import guiasRoutes from "./routes/guiaremision.routes.js";
import categoriaRoutes from "./routes/categoria.routes.js";
import subcategoriaRoutes from "./routes/subcategoria.routes.js";
import reporteRoutes from "./routes/reporte.routes.js";
import destinatarioRoutes from "./routes/destinatario.routes.js";
import vendedoresRoutes from "./routes/vendedores.routes.js";
import sucursalRoutes from "./routes/sucursal.routes.js";
import almacenesRoutes from "./routes/almacen.routes.js";
import funcionesRoutes from "./routes/funciones.routes.js";
import planesRoutes from "./routes/plan_pago.routes.js";
import clienteRoutes from "./routes/clientes.routes.js";
import modulosRoutes from "./routes/modulos.routes.js";
import permisosRoutes from "./routes/permisos.routes.js";
import permisosGlobalesRoutes from "./routes/permisosGlobales.routes.js";
import submodulosRoutes from "./routes/submodulos.routes.js";
import rutasRoutes from "./routes/rutas.routes.js";
import empresaRoutes from "./routes/empresa.routes.js";
import claveRoutes from "./routes/clave.routes.js";
import logotipoRoutes from "./routes/logotipo.routes.js";
import valorRoutes from "./routes/valor.routes.js";
import logsRoutes from "./routes/logs.routes.js";
import { auditLog } from "./middlewares/audit.middleware.js";
import { startLogMaintenance } from "./services/logMaintenance.service.js";

// 🛡️ SANITIZACIÓN CRÍTICA PARA AZURE APP SERVICE
const sanitizeEnvironmentForAzure = () => {
  console.log("🔍 Iniciando sanitización de variables de entorno...");
  const sanitizedVars = [];

  const skipDeleteIf = new Set(["FRONTEND_URL"]);

  Object.keys(process.env).forEach((key) => {
    const value = process.env[key];
    if (!value || typeof value !== "string") return;
    if (key.endsWith("_BACKUP")) return;

    if (/^https?:\/\//i.test(value) && !skipDeleteIf.has(key)) {
      process.env[`${key}_BACKUP`] = value;
      delete process.env[key];
      sanitizedVars.push(key);
      return;
    }
  });

  console.log(
    `🛡️ Sanitización completada_Total. ${sanitizedVars.length} variables procesadas.`
  );
  if (sanitizedVars.length) {
    console.log("🛡️ AZURE FIX: Variables con URLs sanitizadas:", sanitizedVars);
  }
  return sanitizedVars;
};

// EJECUTAR SANITIZACIÓN ANTES DE CREAR LA APP
const sanitizedVars = sanitizeEnvironmentForAzure();

// Manejo de uncaughtException específico
process.on("uncaughtException", (error) => {
  if (error.message && error.message.includes("Missing parameter name")) {
    console.error(
      "🚨 ERROR CRÍTICO DETECTADO: Missing parameter name at path-to-regexp"
    );
    console.error(
      "🔍 Este error indica que una URL completa se está usando como ruta de Express"
    );
    console.error("📝 Error completo:", error.message);
    console.error("🛡️ Variables sanitizadas:", sanitizedVars);

    const remainingProblematic = [];
    Object.keys(process.env).forEach((key) => {
      const value = process.env[key];
      if (value && typeof value === "string" && value.match(/^https?:\/\//)) {
        remainingProblematic.push(`${key}: ${value.substring(0, 50)}...`);
      }
    });

    if (remainingProblematic.length > 0) {
      console.error("🚨 Variables con URLs que aún existen:", remainingProblematic);
    }
    process.exit(1);
  } else {
    console.error("❌ Error no capturado:", error);
    process.exit(1);
  }
});

const app = express();

// Settings
const port = Number(process.env.PORT || process.env.WEBSITES_PORT || 4000);
app.set("port", port);

console.log(`🚀 Servidor iniciando en puerto ${port}`);
console.log(`🌍 Entorno: ${process.env.NODE_ENV || "development"}`);
console.log(`🔗 Frontend URL: ${FRONTEND_URL}`);
console.log(`🔗 Frontend ORIGIN (solo CORS): ${FRONTEND_ORIGIN}`);
if (sanitizedVars.length > 0) {
  console.log(
    `🛡️ Azure: ${sanitizedVars.length} variables problemáticas neutralizadas`
  );
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Middlewares
app.use(morgan("dev"));

// Usa FRONTEND_ORIGIN para CORS (alias FRONTEND_URL sigue válido)
const allowedOrigin = (origin, callback) => {
  if (!origin) return callback(null, true);
  if (origin === FRONTEND_ORIGIN) return callback(null, true);
  if (origin.endsWith(".azurewebsites.net")) return callback(null, true);
  if (/^http:\/\/localhost(:\d+)?$/.test(origin)) return callback(null, true);
  if (/^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) return callback(null, true);
  if (/^https:\/\/localhost(:\d+)?$/.test(origin)) return callback(null, true);
  return callback(new Error("Not allowed by CORS"));
};

app.use(
  cors({
    origin: allowedOrigin,
    methods: "GET,POST,PUT,DELETE,OPTIONS",
    credentials: true,
  })
);
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

// Guard global para detectar rutas inválidas antes de que path-to-regexp falle
function guardPath(p, originLabel = "app/use") {
  if (typeof p === "string" && /^https?:\/\//i.test(p)) {
    console.error(
      `🚨 DETECTADO PATH CON URL (${originLabel}): "${p}" -> reemplazado por "/"`
    );
    return "/";
  }
  return p;
}

// Parche app.use
const originalUse = app.use.bind(app);
app.use = function patchedUse(first, ...rest) {
  first = guardPath(first, "app.use");
  return originalUse(first, ...rest);
};

// Parche Router para rutas internas (solo efecto diagnóstico)
const origRouter = Router;
function PatchedRouter(...args) {
  const r = origRouter(...args);
  const wrap =
    (fn, label) =>
    (first, ...rest) =>
      fn.call(r, guardPath(first, label), ...rest);
  r.use = wrap(r.use, "router.use");
  r.get = wrap(r.get, "router.get");
  r.post = wrap(r.post, "router.post");
  r.put = wrap(r.put, "router.put");
  r.delete = wrap(r.delete, "router.delete");
  return r;
}
// NOTA: Esto sirve solo para nuevos Routers creados después; ya tienes routers importados arriba.
// Si aún apareciera el error, revisar archivos de rutas por cualquier uso dinámico de URLs.

// Validación simple de rutas declaradas
function validateRoute(p) {
  if (
    typeof p === "string" &&
    (p.startsWith("http://") || p.startsWith("https://"))
  ) {
    console.error(`🚨 RUTA INVÁLIDA BLOQUEADA: "${p}"`);
    throw new Error(
      `❌ Ruta inválida detectada: "${p}". Debe iniciar con / (path), no ser URL completa.`
    );
  }
  return p;
}

console.log(
  "🔍 Verificando que no haya variables de entorno problemáticas antes de montar rutas..."
);
const preRouteCheck = Object.keys(process.env).filter((key) => {
  const value = process.env[key];
  return value && typeof value === "string" && value.match(/^https?:\/\//);
});
if (preRouteCheck.length > 0) {
  console.error("🚨 ALERTA: Aún hay variables con URLs después de la sanitización:");
  preRouteCheck.forEach((key) => {
    const value = process.env[key];
    console.error(`   ${key}: ${value.substring(0, 50)}...`);
  });
}

// Rutas
app.use(validateRoute("/api/dashboard"), dashboardRoutes);
app.use(validateRoute("/api/reporte"), reporteRoutes);
app.use(validateRoute("/api/auth"), auhtRoutes);
app.use(validateRoute("/api/usuario"), usuariosRoutes);
app.use(validateRoute("/api/rol"), rolRoutes);
app.use(validateRoute("/api/productos"), productosRoutes);
app.use(validateRoute("/api/ventas"), ventasRoutes);
app.use(validateRoute("/api/marcas"), marcasRoutes);
app.use(validateRoute("/api/nota_ingreso"), ingresosRoutes);
app.use(validateRoute("/api/nota_salida"), salidaRoutes);
app.use(validateRoute("/api/destinatario"), destinatarioRoutes);
app.use(validateRoute("/api/kardex"), kardexRoutes);
app.use(validateRoute("/api/guia_remision"), guiasRoutes);
app.use(validateRoute("/api/categorias"), categoriaRoutes);
app.use(validateRoute("/api/subcategorias"), subcategoriaRoutes);
app.use(validateRoute("/api/vendedores"), vendedoresRoutes);
app.use(validateRoute("/api/sucursales"), sucursalRoutes);
app.use(validateRoute("/api/almacen"), almacenesRoutes);
app.use(validateRoute("/api/funciones"), funcionesRoutes);
app.use(validateRoute("/api/planes"), planesRoutes);
app.use(validateRoute("/api/clientes"), clienteRoutes);
app.use(validateRoute("/api/modulos"), modulosRoutes);
app.use(validateRoute("/api/submodulos"), submodulosRoutes);
app.use(validateRoute("/api/permisos"), permisosRoutes);
app.use(validateRoute("/api/permisos-globales"), permisosGlobalesRoutes);
app.use(validateRoute("/api/rutas"), rutasRoutes);
app.use(validateRoute("/api/empresa"), empresaRoutes);
app.use(validateRoute("/api/clave"), claveRoutes);
app.use(validateRoute("/api/logotipo"), logotipoRoutes);
app.use(validateRoute("/api/valor"), valorRoutes);
app.use(validateRoute("/api/logs"), logsRoutes);

// Static frontend
app.use(express.static(path.join(__dirname, "../client/dist")));

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});

// Servicio mantenimiento logs
try {
  startLogMaintenance();
} catch (error) {
  console.error("❌ Error iniciando servicio de mantenimiento de logs:", error);
}

export default app;
