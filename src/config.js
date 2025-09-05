import { config } from "dotenv";
config();

export const HOST = process.env.DB_HOST || "";
export const DATABASE = process.env.DB_DATABASE || "";
export const USER = process.env.DB_USERNAME || "";
export const PASSWORD = process.env.DB_PASSWORD || "";
export const PORT_DB = process.env.DB_PORT || "3306";
export const TOKEN_SECRET = process.env.TOKEN_SECRET || "";

// URL SOLO PARA CORS / LINKS (NO USAR COMO PATH DE EXPRESS)
export const FRONTEND_ORIGIN = process.env.FRONTEND_URL || "http://localhost:5173";
// Mantener compatibilidad si en algún sitio aún se importa FRONTEND_URL
export const FRONTEND_URL = FRONTEND_ORIGIN;