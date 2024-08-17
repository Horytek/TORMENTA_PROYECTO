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

const app = express();

// Settings
app.set("port", 4000);

// Middlewares
app.use(morgan("dev"));
app.use(cors({
    origin: FRONTEND_URL,
    credentials: true
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

export default app;