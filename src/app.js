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
import kardexRoutes from "./routes/kardex.routes.js"
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

// 🛡️ SANITIZACIÓN CRÍTICA PARA AZURE APP SERVICE
// Azure puede inyectar variables de entorno con URLs que rompen Express
const sanitizeEnvironmentForAzure = () => {
    // Lista completa de variables problemáticas conocidas de Azure
    const azureProblematicVars = [
        'REPOSITORY_URL', 'SCM_REPOSITORY_URL', 'SCM_COMMIT_ID', 'SCM_BRANCH',
        'DEPLOYMENT_SOURCE_URL', 'GITHUB_REPOSITORY_URL', 'GITHUB_REF', 'GITHUB_SHA',
        'GITLAB_CI_REPOSITORY_URL', 'CI_REPOSITORY_URL', 'BUILD_REPOSITORY_URI',
        'BITBUCKET_REPO_FULL_NAME', 'WEBSITE_SITE_NAME', 'APPSETTING_WEBSITE_SITE_NAME',
        // Variables adicionales que pueden contener URLs
        'REMOTE_URL', 'GIT_URL', 'SOURCE_URL', 'ORIGIN_URL'
    ];
    
    const sanitizedVars = [];
    
    // Sanitizar variables específicas conocidas
    azureProblematicVars.forEach(varName => {
        if (process.env[varName]) {
            const value = process.env[varName];
            if (typeof value === 'string' && value.includes('://')) {
                process.env[`${varName}_BACKUP`] = value;
                delete process.env[varName];
                sanitizedVars.push(varName);
            }
        }
    });
    
    // Buscar CUALQUIER variable que contenga URLs que empiecen con https://g (GitHub)
    Object.keys(process.env).forEach(key => {
        const value = process.env[key];
        if (value && typeof value === 'string' && 
            (value.startsWith('https://g') || value.match(/https:\/\/github\.com|https:\/\/gitlab\.com/))) {
            process.env[`${key}_BACKUP`] = value;
            delete process.env[key];
            sanitizedVars.push(key);
        }
    });
    
    if (sanitizedVars.length > 0) {
        console.log('🛡️ AZURE FIX: Variables con URLs sanitizadas para prevenir error "Missing parameter name":', sanitizedVars);
    }
    
    return sanitizedVars;
};

// EJECUTAR SANITIZACIÓN ANTES DE CREAR LA APP
const sanitizedVars = sanitizeEnvironmentForAzure();

const app = express();

// Settings
const port = Number(process.env.PORT || process.env.WEBSITES_PORT || 4000);
app.set("port", port);

console.log(`🚀 Servidor iniciando en puerto ${port}`);
console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔗 Frontend URL: ${FRONTEND_URL}`);
if (sanitizedVars.length > 0) {
    console.log(`🛡️ Azure: ${sanitizedVars.length} variables problemáticas neutralizadas`);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Middlewares
app.use(morgan("dev"));
const allowedOrigin = (origin, callback) => {
    // permite peticiones sin origin (Postman, curl, apps móviles…)
    if (!origin) {
        return callback(null, true);
    }
    // permite tu FRONTEND_URL desde .env
    if (origin === FRONTEND_URL) {
        return callback(null, true);
    }
    // mantiene tus reglas para localhost y LAN
    if (
        /^http:\/\/localhost(:\d+)?$/.test(origin) ||
        /^http:\/\/192\.168\.194\.\d{1,3}(:\d+)?$/.test(origin)
    ) {
        return callback(null, true);
    }
    // rechaza el resto
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

// 🛡️ Validación de rutas - prevenir URLs completas como paths
function validateRoute(path) {
    if (typeof path === 'string' && (path.startsWith('http://') || path.startsWith('https://'))) {
        throw new Error(`❌ Ruta inválida detectada: "${path}". Las rutas deben ser paths (empezar con /) no URLs completas.`);
    }
    return path;
}

// Routes
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
