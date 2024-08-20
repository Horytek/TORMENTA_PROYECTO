import { config } from "dotenv";

config();

export const HOST = process.env.HOST || "";
export const DATABASE = process.env.DATABASE || "";
export const USER = process.env.USER || "";
export const PASSWORD = process.env.PASSWORD || "";
export const PORT_DB = process.env.PORT_DB || "3306";
export const TOKEN_SECRET = process.env.TOKEN_SECRET || "";
export const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:4000";
export const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";