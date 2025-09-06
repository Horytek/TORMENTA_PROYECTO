import { config } from "dotenv";
config();

export const HOST = process.env.DB_HOST || "";
export const DATABASE = process.env.DB_DATABASE || "";
export const USER = process.env.DB_USERNAME || "";
export const PASSWORD = process.env.DB_PASSWORD || "";
export const PORT_DB = process.env.DB_PORT || "3306";
export const TOKEN_SECRET = process.env.TOKEN_SECRET || "";
export const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:4000";