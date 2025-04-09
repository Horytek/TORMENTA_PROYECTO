import express from "express";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";
import { FRONTEND_URL } from "./config.js";
//Rutas
import dashboardRoutes from "./routes/dashboard.routes";
import auhtRoutes from "./routes/auth.routes";
import usuariosRoutes from "./routes/usuarios.routes";
import rolRoutes from "./routes/rol.routes.js";
import productosRoutes from "./routes/productos.routes";
import ventasRoutes from "./routes/ventas.routes";
import marcasRoutes from "./routes/marcas.routes";
import ingresosRoutes from "./routes/notaingreso.routes";
import salidaRoutes from "./routes/notasalida.routes";
import kardexRoutes from "./routes/kardex.routes.js"
import guiasRoutes from "./routes/guiaremision.routes";
import categoriaRoutes from "./routes/categoria.routes";
import subcategoriaRoutes from "./routes/subcategoria.routes";
import reporteRoutes from "./routes/reporte.routes";
import destinatarioRoutes from "./routes/destinatario.routes";
import vendedoresRoutes from "./routes/vendedores.routes.js";
import sucursalRoutes from "./routes/sucursal.routes";
import almacenesRoutes from "./routes/almacen.routes.js";
import funcionesRoutes from "./routes/funciones.routes.js";
import planesRoutes from "./routes/plan_pago.routes.js";
import clienteRoutes from "./routes/clientes.routes.js";
import modulosRoutes from "./routes/modulos.routes.js";
import permisosRoutes from "./routes/permisos.routes.js";
import submodulosRoutes from "./routes/submodulos.routes.js";
import rutasRoutes from "./routes/rutas.routes.js";


const app = express();

// Settings
const port = process.env.PORT || 4000;
app.set("port", port);

// Middlewares
app.use(morgan("dev"));
const allowedOrigin = (origin, callback) => {
    // Verifica si el origen está en el rango 192.168.194.0/24
    if (origin && /^http:\/\/192\.168\.194\.\d{1,3}(:\d+)?$/.test(origin)) {
        callback(null, true);  // Permite la solicitud si coincide con el rango
    } else {
        callback(new Error('Not allowed by CORS'));  // Rechaza si no coincide
    }
};

app.use(cors({
    origin: allowedOrigin,  // Usa la función personalizada para validar el origen
    methods: "GET,POST,PUT,DELETE,OPTIONS",
    credentials: true  // Permite el uso de credenciales (cookies, tokens, etc.)
}));
app.use(express.json());
app.use(cookieParser());

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
app.use("/api/rutas", rutasRoutes);


export default app;