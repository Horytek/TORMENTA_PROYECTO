import { config } from "dotenv";

config();

export const HOST = process.env.HOST || "tormenta99-destinyelvacio-ba20.j.aivencloud.com";
export const DATABASE = process.env.DATABASE || "db_tormenta";
export const USER = process.env.USER || "avnadmin";
export const PASSWORD = process.env.PASSWORD || "AVNS_-YieSNq_KeFjHhz8MuR";
export const PORT_DB = process.env.PORT_DB || "28990";
export const TOKEN_SECRET = process.env.TOKEN_SECRET || "tormenta_secreto";
export const FRONTEND_URL = process.env.FRONTEND_URL || "https://tormenta-proyecto-kmj2.vercel.app";