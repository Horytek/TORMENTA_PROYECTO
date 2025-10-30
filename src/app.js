import express from "express";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
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
import chatRoutes from "./routes/chat.routes.js";
import helpRoutes from "./routes/help.routes.js";
import functionShortcutsRoutes from "./routes/functionShortcuts.routes.js";
import { auditLog } from "./middlewares/audit.middleware.js";
import { startLogMaintenance } from "./services/logMaintenance.service.js";
import { getConnection } from "./database/database.js";
import emailRoutes from "./routes/email.routes.js";
import credencialRoutes from "./routes/credenciales.routes.js";
import paymentRoutes from "./routes/payment.routes.js";

const app = express();
app.set('trust proxy', 1);

// Settings
const port = process.env.PORT || 4000 ;
app.set("port", port);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Middlewares
app.use(morgan("dev"));
app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "https://sdk.mercadopago.com",
        "https://gc.kis.v2.scr.kaspersky-labs.com",
        "wss://gc.kis.v2.scr.kaspersky-labs.com",
        "https://http2.mlstatic.com",
        "https://mercadopago.com",
        "https://www.mercadopago.com",
        "https://op-cho-bricks.mercadopago.com",
        "'sha256-m7IJ+wWU57KuxY8Byp8Cq6F39R/uj0Dv7A1+xM1bXMQ='",
      ],
      connectSrc: [
        "'self'",
        "https://sdk.mercadopago.com",
        "https://api.mercadopago.com",
        "https://http2.mlstatic.com",
        "https://op-cho-bricks.mercadopago.com",
        "https://api.mercadolibre.com",
        "https://facturacion.apisperu.com/api"
      ],
      frameSrc: [
        "'self'",
        "https://mercadopago.com.pe",
        "https://www.mercadopago.com",
        "https://www.mercadopago.com.pe",
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https://i.ibb.co",
        "https://facturacion.apisperu.com/api"
      ],
      // ...otras directivas...
    }
  })
);

app.use(express.json({ limit: '2mb' })); // o más si lo necesitas
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

const norm = u => { 
  try { 
    const {protocol,host}=new URL(u); 
    return `${protocol}//${host}`.toLowerCase(); 
  } catch { 
    return null; 
  } 
};

const ALLOW = new Set(
  [process.env.FRONTEND_URL, process.env.FRONTEND_URL_BACKUP]
    .filter(Boolean)
    .flatMap(u => {
      const n = norm(u); 
      if (!n) return [];
      return n.startsWith('http://') 
        ? [n, n.replace('http://','https://')]
        : [n, n.replace('https://','http://')];
    })
);

const local = [
  /^https?:\/\/localhost(:\d+)?$/i,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/i,
  /^https?:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/i,
  /^https?:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/i,
  /^https?:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}(:\d+)?$/i,
];

const allowedOrigin = (origin, cb) => {
  if (!origin) return cb(null, true);
  const n = norm(origin);
  if ((n && ALLOW.has(n)) || local.some(re => re.test(origin))) return cb(null, true);
  cb(new Error('Not allowed by CORS'));
};

app.use(cors({
    origin: allowedOrigin,
    methods: "GET,POST,PUT,DELETE,OPTIONS",
    credentials: true
}));
// habilita pre‑flight OPTIONS en todas las rutas
app.options(/.*/, cors({
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
app.use("/api/chat", chatRoutes);
app.use("/api/help", helpRoutes);
app.use("/api/function-shortcuts", functionShortcutsRoutes);
app.use("/api", emailRoutes);
app.use("/api", credencialRoutes);
app.use("/api", paymentRoutes);

// Servir archivos estáticos de Vite/React
app.use(express.static(path.join(__dirname, "../client/dist")));

// Redirigir todas las rutas no API al frontend (SPA)
app.get(/.*/, (req, res, next) => {
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