import { config } from "dotenv";
config();

export const HOST = process.env.DB_HOST || "";
export const DATABASE = process.env.DB_DATABASE || "";
export const TESIS_DATABASE = process.env.TESIS_DB_DATABASE || "tesis_db";
export const EXPRESS_DATABASE = process.env.EXPRESS_DB_DATABASE || "express_db";
export const USER = process.env.DB_USERNAME || "";
export const PASSWORD = process.env.DB_PASSWORD || "";
export const PORT_DB = process.env.DB_PORT || "3306";
export const TOKEN_SECRET = process.env.TOKEN_SECRET || "";
export const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:4000";

// Exportar el certificado SSL para la base de datos
export const DB_SSL_CA = process.env.DB_SSL_CA
  ? process.env.DB_SSL_CA.replace(/\\n/g, "\n")
  : undefined;