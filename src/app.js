import express from "express";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { apiReference } from '@scalar/express-api-reference';
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
import transferenciaAlmacenRoutes from "./routes/transferenciaAlmacen.routes.js";
import kardexRoutes from "./routes/kardex.routes.js";
import costosRoutes from "./routes/costos.routes.js";
import kardexInventarioRoutes from "./routes/kardexInventario.routes.js";
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
import planTemplatesRoutes from "./routes/planTemplates.routes.js";
import authzRoutes from "./routes/authz.routes.js";
import submodulosRoutes from "./routes/submodulos.routes.js";
import rutasRoutes from "./routes/rutas.routes.js";
import empresaRoutes from "./routes/empresa.routes.js";
import claveRoutes from './routes/clave.routes.js';
import logotipoRoutes from "./routes/logotipo.routes.js";
import logsRoutes from "./routes/logs.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import helpRoutes from "./routes/help.routes.js";
import functionShortcutsRoutes from "./routes/functionShortcuts.routes.js";
import { auditLog } from "./middlewares/audit.middleware.js";
import { getConnection } from "./database/database.js";
import attributesRoutes from "./routes/attributes.routes.js";
import emailRoutes from "./routes/email.routes.js";
import expressRoutes from "./routes/express.routes.js";
import ecommerceRoutes from "./routes/ecommerce.routes.js";
import stockSyncRoutes from "./routes/stockSync.routes.js";
import mayoristaRoutes from "./routes/mayorista.routes.js";
import {
  tallerRouter,
  crmRouter,
  enviosRouter,
  wmsRouter,
  despachoRouter,
  campoRouter,
  mantenimientoRouter,
  reclutaRouter,
  preventaRouter,
  taxiRouter,
  deliveryRouter,
  flotasRouter,
  academiaRouter,
  agendaRouter,
} from "./routes/platformWaves.routes.js";
import horytekProductsRoutes from "./routes/horytekProducts.routes.js";
import atelierRouter from "./routes/atelier.routes.js";

const app = express();
app.set('trust proxy', 1);



import credencialRoutes from "./routes/credenciales.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import verificationConfigRoutes from "./routes/verificationConfig.routes.js";
import landingRoutes from "./routes/landing.routes.js";
import negocioRoutes from "./routes/negocio.routes.js";
import healthRoutes from "./routes/health.routes.js";
import developerRoutes from "./routes/developer.routes.js";
import syncRoutes from "./routes/sync.routes.js";
import sunatRoutes from "./routes/sunat.routes.js";
import cpeRoutes from "./routes/cpe.routes.js";
import integracionesRoutes from "./routes/integraciones.routes.js";
import uploadsRoutes from "./routes/uploads.routes.js";
import ordenCompraRoutes from "./routes/ordenCompra.routes.js";
import devolucionesRoutes from "./routes/devoluciones.routes.js";
import cajaTurnoRoutes from "./routes/cajaTurno.routes.js";
import catalogoPublicoRoutes from "./routes/catalogoPublico.routes.js";
import puntosRoutes from "./routes/puntos.routes.js";
import facturaCompraRoutes from "./routes/facturaCompra.routes.js";
import cuentaPorPagarRoutes from "./routes/cuentaPorPagar.routes.js";
import anticipoProveedorRoutes from "./routes/anticipoProveedor.routes.js";
import cuentaPorCobrarRoutes from "./routes/cuentaPorCobrar.routes.js";
import tallaRoutes from "./routes/talla.routes.js";
import tonalidadRoutes from "./routes/tonalidad.routes.js";
import loteRoutes from "./routes/lote.routes.js";
import unidadesRoutes from "./routes/unidades.routes.js";
import gastosRoutes from "./routes/gastos.routes.js";
import cuentaContableRoutes from "./routes/cuentaContable.routes.js";
import centroCostoRoutes from "./routes/centroCosto.routes.js";
import periodoContableRoutes from "./routes/periodoContable.routes.js";
import asientoContableRoutes from "./routes/asientoContable.routes.js";
import contabilidadConfigRoutes from "./routes/contabilidadConfig.routes.js";
import tesoreriaRoutes from "./routes/tesoreria.routes.js";
import presupuestoRoutes from "./routes/presupuesto.routes.js";
import estadosFinancierosRoutes from "./routes/estadosFinancieros.routes.js";
import auditoriaContableRoutes from "./routes/auditoriaContable.routes.js";
import resumenContableRoutes from "./routes/resumenContable.routes.js";
import inventoryMovementRoutes from "./routes/inventoryMovement.routes.js";

// Settings
const port = process.env.PORT || 4000;
app.set("port", port);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Middlewares
app.use(morgan("dev"));
app.use(helmet({
  contentSecurityPolicy: {
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
        "https://api.mercadolibre.com"
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
        "https://ik.imagekit.io",
        "blob:"
      ],
    }
  },
  strictTransportSecurity: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  xFrameOptions: { action: "sameorigin" },
  xContentTypeOptions: true,
  xXssProtection: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" }
}));

app.use(express.json({ limit: '10mb' })); // o más si lo necesitas
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const norm = u => {
  try {
    const { protocol, host } = new URL(u);
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
        ? [n, n.replace('http://', 'https://')]
        : [n, n.replace('https://', 'http://')];
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
app.use("/api/transferencia_almacen", transferenciaAlmacenRoutes);
app.use("/api/destinatario", destinatarioRoutes);
app.use("/api/kardex", kardexRoutes);
app.use("/api/costos", costosRoutes);
app.use("/api/kardex-inventario", kardexInventarioRoutes);
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
app.use("/api/config-verification", verificationConfigRoutes);
app.use("/api/submodulos", submodulosRoutes);
app.use("/api/permisos", permisosRoutes);
app.use("/api/permisos-globales", permisosGlobalesRoutes);
app.use("/api/plan-templates", planTemplatesRoutes);
app.use("/api/authz", authzRoutes);
app.use("/api/rutas", rutasRoutes);
app.use("/api/empresa", empresaRoutes);
app.use("/api/clave", claveRoutes);
app.use("/api/logotipo", logotipoRoutes);
app.use("/api/logs", logsRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/compras/ordenes", ordenCompraRoutes);
app.use("/api/devoluciones", devolucionesRoutes);
app.use("/api/catalogo", catalogoPublicoRoutes);
app.use("/api/puntos", puntosRoutes);
app.use("/api/caja-turno", cajaTurnoRoutes);
app.use("/api/inventory-movements", inventoryMovementRoutes);
app.use("/api/compras/facturas", facturaCompraRoutes);
app.use("/api/compras/cuentas-por-pagar", cuentaPorPagarRoutes);
app.use("/api/compras/anticipos", anticipoProveedorRoutes);
app.use("/api/clientes/cuentas-por-cobrar", cuentaPorCobrarRoutes);
app.use("/api/help", helpRoutes);
app.use("/api/function-shortcuts", functionShortcutsRoutes);
app.use("/api/negocio", negocioRoutes);
app.use("/api/developer", developerRoutes);
app.use("/api/sync", syncRoutes);
app.use("/api/sunat", sunatRoutes);
app.use("/api/cpe", cpeRoutes);
app.use("/api/integraciones", integracionesRoutes);
app.use("/api/uploads", uploadsRoutes);
app.use("/api/talla", tallaRoutes);
app.use("/api/tonalidad", tonalidadRoutes);
app.use("/api/lote", loteRoutes);
app.use("/api/attributes", attributesRoutes);
app.use("/api", emailRoutes);
app.use("/api", credencialRoutes);
app.use("/api", paymentRoutes);
app.use("/api/landing", landingRoutes);
app.use("/api/unidades", unidadesRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/express", expressRoutes);
app.use("/api/ecommerce", ecommerceRoutes);
app.use("/api/stock-sync", stockSyncRoutes);
app.use("/api/mayorista", mayoristaRoutes);
app.use("/api/taller", tallerRouter);
app.use("/api/crm", crmRouter);
app.use("/api/envios", enviosRouter);
app.use("/api/wms", wmsRouter);
app.use("/api/despacho", despachoRouter);
app.use("/api/campo", campoRouter);
app.use("/api/mantenimiento", mantenimientoRouter);
app.use("/api/recluta", reclutaRouter);
app.use("/api/preventa", preventaRouter);
app.use("/api/taxi", taxiRouter);
app.use("/api/delivery", deliveryRouter);
app.use("/api/flotas", flotasRouter);
app.use("/api/academia", academiaRouter);
app.use("/api/agenda", agendaRouter);
app.use("/api/horytek-products", horytekProductsRoutes);
app.use("/api/atelier", atelierRouter);
app.use("/api/gastos", gastosRoutes);
app.use("/api/contabilidad/cuentas", cuentaContableRoutes);
app.use("/api/contabilidad/centros-costo", centroCostoRoutes);
app.use("/api/contabilidad/periodos", periodoContableRoutes);
app.use("/api/contabilidad/asientos", asientoContableRoutes);
app.use("/api/contabilidad/configuracion", contabilidadConfigRoutes);
app.use("/api/contabilidad/tesoreria", tesoreriaRoutes);
app.use("/api/contabilidad/presupuestos", presupuestoRoutes);
app.use("/api/contabilidad/estados-financieros", estadosFinancierosRoutes);
app.use("/api/contabilidad/auditoria", auditoriaContableRoutes);
app.use("/api/contabilidad/resumen", resumenContableRoutes);


// Servir archivos estáticos (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Documentación API (Scalar)
app.use(
  '/api-docs',
  apiReference({
    spec: {
      content: {
        openapi: '3.1.0',
        info: {
          title: 'Tormenta Project API',
          version: '1.0.0',
        },
        paths: {
          '/api/status': {
            get: {
              description: 'Check API Status',
              responses: {
                200: {
                  description: 'OK',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          status: { type: 'string', example: 'ok' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })
);

// Frontend estatico. La ruta es configurable porque hay dos clientes en el
// repo: `client` (legado) y `client-v2` (donde esta el trabajo actual). El
// default preserva el comportamiento historico; el despliegue en VPS define
// FRONTEND_DIST=client-v2/dist. Vercel no pasa por aca: sirve client-v2 con su
// propio enrutamiento y solo manda /api a la funcion.
const FRONTEND_DIST = path.join(__dirname, "..", process.env.FRONTEND_DIST || "client/dist");

app.use(express.static(FRONTEND_DIST));

// Redirigir todas las rutas no API al frontend (SPA)
app.get(/.*/, (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(FRONTEND_DIST, "index.html"));
});
// Las tareas programadas (mantenimiento de logs, suscripciones e inventario
// ecommerce) se movieron a `worker.js`, que corre como proceso aparte.
//
// Vivian aca, o sea que arrancaban junto con Express. Eso las dejaba muertas en
// produccion —Vercel es serverless y el proceso no sobrevive entre requests— y
// ataba el tier web a una sola instancia, porque con dos replicas cada cron
// correria dos veces. Uno de ellos cobra suscripciones.
//
// Levantar el worker con:  npm run worker

export default app;