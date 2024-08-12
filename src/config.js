import { config } from "dotenv";

config();

export const HOST = process.env.HOST || "";
export const DATABASE = process.env.DATABASE || "";
export const USER = process.env.USER || "";
export const PASSWORD = process.env.PASSWORD || "";
export const TOKEN_SECRET = process.env.TOKEN_SECRET || "";
export const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:4000";