import express from "express";
import morgan from "morgan";
import cors from "cors";
import languageRoutes from "./routes/language.routes";
import usuariosRoutes from "./routes/usuarios.routes";


const app = express();

// Settings
app.set("port", 4000);

// Middlewares
app.use(morgan("dev"));
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/languages",languageRoutes);
app.use("/api/usuarios", usuariosRoutes);


export default app;