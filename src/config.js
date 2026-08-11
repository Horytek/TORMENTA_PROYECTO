import { config } from "dotenv";
config();

export const HOST = process.env.DB_HOST || "";
export const DATABASE = process.env.DB_DATABASE || "";
export const TESIS_DATABASE = process.env.TESIS_DB_DATABASE || "tesis_db";
export const EXPRESS_DATABASE = process.env.EXPRESS_DB_DATABASE || "express_db";
export const ECOMMERCE_DATABASE = process.env.ECOMMERCE_DB_DATABASE || "db_ecommerce";
/** Productos nuevos — una DATABASE por dominio (ver horytekProducts.config.js) */
export const SYNC_DATABASE = process.env.SYNC_DB_DATABASE || "db_sync";
export const MAYORISTA_DATABASE = process.env.MAYORISTA_DB_DATABASE || "db_mayorista";
export const TALLER_DATABASE = process.env.TALLER_DB_DATABASE || "db_taller";
export const PREVENTA_DATABASE = process.env.PREVENTA_DB_DATABASE || "db_preventa";
export const CRM_DATABASE = process.env.CRM_DB_DATABASE || "db_crm";
export const ENVIOS_DATABASE = process.env.ENVIOS_DB_DATABASE || "db_envios";
export const WMS_DATABASE = process.env.WMS_DB_DATABASE || "db_wms";
export const DESPACHO_DATABASE = process.env.DESPACHO_DB_DATABASE || "db_despacho";
export const TAXI_DATABASE = process.env.TAXI_DB_DATABASE || "db_taxi";
export const DELIVERY_DATABASE = process.env.DELIVERY_DB_DATABASE || "db_delivery";
export const FLOTAS_DATABASE = process.env.FLOTAS_DB_DATABASE || "db_flotas";
export const CAMPO_DATABASE = process.env.CAMPO_DB_DATABASE || "db_campo";
export const ACADEMIA_DATABASE = process.env.ACADEMIA_DB_DATABASE || "db_academia";
export const AGENDA_DATABASE = process.env.AGENDA_DB_DATABASE || "db_agenda";
export const MANTENIMIENTO_DATABASE = process.env.MANTENIMIENTO_DB_DATABASE || "db_mantenimiento";
export const RECLUTA_DATABASE = process.env.RECLUTA_DB_DATABASE || "db_recluta";
export const ATELIER_DATABASE = process.env.ATELIER_DB_DATABASE || "db_atelier";
export const USER = process.env.DB_USERNAME || "";
export const PASSWORD = process.env.DB_PASSWORD || "";
export const PORT_DB = process.env.DB_PORT || "3306";
export const TOKEN_SECRET = process.env.TOKEN_SECRET || "";
export const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:4000";

// Exportar el certificado SSL para la base de datos
export const DB_SSL_CA = undefined;