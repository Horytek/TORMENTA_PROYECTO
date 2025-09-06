import express from "express";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";
import { FRONTEND_URL } from "./config.js";
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
import claveRoutes from './routes/clave.routes.js';
import logotipoRoutes from "./routes/logotipo.routes.js";
import valorRoutes from "./routes/valor.routes.js";
import logsRoutes from "./routes/logs.routes.js";
import { auditLog } from "./middlewares/audit.middleware.js";
import { startLogMaintenance } from "./services/logMaintenance.service.js";

const app = express();

// Settings
const port = process.env.PORT || 4000 ;
app.set("port", port);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Middlewares
app.use(morgan("dev"));
const allowedOrigin = (origin, callback) => {
    if (!origin) {
        return callback(null, true);
    }
    // permite tu FRONTEND_URL desde .env (acepta http y https)
    if (
        origin === FRONTEND_URL ||
        origin === FRONTEND_URL.replace('http://', 'https://') ||
        origin === FRONTEND_URL.replace('https://', 'http://')
    ) {
        return callback(null, true);
    }
    // permite localhost y LAN con http o https
    if (
        /^https?:\/\/localhost(:\d+)?$/.test(origin) ||
        /^https?:\/\/192\.168\.194\.\d{1,3}(:\d+)?$/.test(origin)
    ) {
        return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
};


app.use(cors({
    origin: allowedOrigin,
    methods: "GET,POST,PUT,DELETE,OPTIONS",
    credentials: true
}));
// habilita pre‑flight OPTIONS en todas las rutas
app.options("*", cors({
    origin: allowedOrigin,
    methods: "GET,POST,PUT,DELETE,OPTIONS",
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());
// Auditoría (después de parseos, antes de rutas) - registra solo rutas autenticadas luego
// app.use(auditLog()); // DESACTIVADO: genera acciones no válidas como "GET OK"

// Routes
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reporte", reporteRoutes);
app.use("/api/auth", auhtRoutes);
app.use("/api/usuario", usuariosRoutes);
app.use("/api/rol", rolRoutes);
app.use("/api/productos", productosRoutes);
app.use("/api/ventas", ventasRoutes);
app.use("/api/marcas", marcasRoutes);
app.use("/api/nota_ingreso", ingresosRoutes);
app.use("/api/nota_salida", salidaRoutes);
app.use("/api/destinatario", destinatarioRoutes);
app.use("/api/kardex", kardexRoutes);
app.use("/api/guia_remision", guiasRoutes);
app.use("/api/categorias", categoriaRoutes);
app.use("/api/subcategorias", subcategoriaRoutes);
app.use("/api/vendedores", vendedoresRoutes);
app.use("/api/sucursales", sucursalRoutes);
app.use("/api/almacen", almacenesRoutes);
app.use("/api/funciones", funcionesRoutes);
app.use("/api/planes", planesRoutes);
app.use("/api/clientes", clienteRoutes);
app.use("/api/modulos", modulosRoutes);
app.use("/api/submodulos", submodulosRoutes);
app.use("/api/permisos", permisosRoutes);
app.use("/api/permisos-globales", permisosGlobalesRoutes);
app.use("/api/rutas", rutasRoutes);
app.use("/api/empresa", empresaRoutes);
app.use("/api/clave", claveRoutes);
app.use("/api/logotipo", logotipoRoutes);
app.use("/api/valor", valorRoutes);
app.use("/api/logs", logsRoutes);

// Servir archivos estáticos de Vite/React
app.use(express.static(path.join(__dirname, "../client/dist")));

// Redirigir todas las rutas no API al frontend (SPA)
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});

// Inicializar servicio de mantenimiento de logs
try {
  startLogMaintenance();
  //console.log('🔧 Servicio de mantenimiento de logs iniciado correctamente');
} catch (error) {
  console.error('❌ Error iniciando servicio de mantenimiento de logs:', error);
}

export default app;