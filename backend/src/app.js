import express from "express";
import morgan from "morgan";
import cors from "cors";
import usuariosRoutes from "./routes/usuarios.routes";
import productosRoutes from "./routes/productos.routes";
import ventasRoutes from "./routes/ventas.routes";
import marcasRoutes from "./routes/marcas.routes";
import ingresosRoutes from "./routes/notaingreso.routes";
import guiasRoutes from "./routes/guiaremision.routes";
import categoriaRoutes from "./routes/categoria.routes";
import subcategoriaRoutes from "./routes/subcategoria.routes";

const app = express();

// Settings
app.set("port", 4000);

// Middlewares
app.use(morgan("dev"));
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/productos", productosRoutes);
app.use("/api/ventas", ventasRoutes);
app.use("/api/marcas", marcasRoutes);
app.use("/api/nota_ingreso", ingresosRoutes);
app.use("/api/guia_remision", guiasRoutes);
app.use("/api/categorias", categoriaRoutes);
app.use("/api/subcategorias", subcategoriaRoutes);

export default app;