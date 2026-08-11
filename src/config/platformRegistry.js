/**
 * Registro de pools por producto (arquitectura modular).
 * Cada producto con BD propia importa su pool desde aquí o desde database_*.js.
 */
export {
  SYNC_DATABASE,
  MAYORISTA_DATABASE,
  TALLER_DATABASE,
  PREVENTA_DATABASE,
  CRM_DATABASE,
  ENVIOS_DATABASE,
  WMS_DATABASE,
  DESPACHO_DATABASE,
  TAXI_DATABASE,
  DELIVERY_DATABASE,
  FLOTAS_DATABASE,
  CAMPO_DATABASE,
  ACADEMIA_DATABASE,
  AGENDA_DATABASE,
  MANTENIMIENTO_DATABASE,
  RECLUTA_DATABASE,
  ECOMMERCE_DATABASE,
  EXPRESS_DATABASE,
  DATABASE as ERP_DATABASE,
} from "../config.js";

export { HORYTEK_PRODUCTS, HORYTEK_BUNDLES, productsNeedingOwnDatabase } from "../config/horytekProducts.config.js";

/** Mapa id producto → env key de DATABASE */
export const PRODUCT_DATABASE_ENV = {
  sync: "SYNC_DB_DATABASE",
  mayorista: "MAYORISTA_DB_DATABASE",
  taller: "TALLER_DB_DATABASE",
  preventa: "PREVENTA_DB_DATABASE",
  crm: "CRM_DB_DATABASE",
  envios: "ENVIOS_DB_DATABASE",
  wms: "WMS_DB_DATABASE",
  despacho: "DESPACHO_DB_DATABASE",
  taxi: "TAXI_DB_DATABASE",
  delivery: "DELIVERY_DB_DATABASE",
  flotas: "FLOTAS_DB_DATABASE",
  campo: "CAMPO_DB_DATABASE",
  academia: "ACADEMIA_DB_DATABASE",
  agenda: "AGENDA_DB_DATABASE",
  mantenimiento: "MANTENIMIENTO_DB_DATABASE",
  recluta: "RECLUTA_DB_DATABASE",
};
