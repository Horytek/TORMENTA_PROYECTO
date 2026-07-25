/**
 * Comprobantes electrónicos (CPE) — contrato con `/api/cpe`.
 *
 * El estado NO lo decide el frontend: viene derivado del ResponseCode del CDR
 * que devolvió SUNAT y que el backend persistió. Acá solo se muestra.
 */

/** Estados de `comprobante_electronico.estado` (src/services/sunat/cpeCdr.js). */
export type EstadoCpe =
  | "PENDIENTE"
  | "ENVIANDO"
  | "ACEPTADO"
  | "ACEPTADO_CON_OBS"
  | "ACEPTADO_SIN_RESPALDO"
  | "RECHAZADO"
  | "INCIERTO"
  | "ERROR_ENVIO"
  | "ERROR_CONFIG"
  | "ANULADO";

/** Catálogo 01 de SUNAT. */
export type TipoDocCpe = "01" | "03";

export interface Comprobante {
  id_cpe: number;
  id_venta: number;
  tipo_doc: TipoDocCpe;
  serie: string;
  correlativo: string;
  nombre_archivo: string;
  fecha_emision: string;
  moneda: string;
  mto_oper_gravadas: string | number;
  mto_igv: string | number;
  mto_imp_venta: string | number;
  tipo_doc_cliente: string | null;
  num_doc_cliente: string | null;
  nombre_cliente: string | null;
  estado: EstadoCpe;
  sunat_response_code: string | null;
  sunat_descripcion: string | null;
  sunat_env: string | null;
  origen: string | null;
  sin_respaldo: number;
  intentos: number;
  ultimo_error: string | null;
  ultimo_error_categoria: string | null;
  creado_en: string;
  respondido_en: string | null;
  [key: string]: unknown; // AdaptiveCollection exige Record<string, unknown>
}

/** Una fila de `comprobante_electronico_envio` — bitácora append-only de intentos. */
export interface IntentoCpe {
  intento: number;
  operacion: string;
  resultado: string | null;
  sunat_response_code: string | null;
  mensaje: string | null;
  duracion_ms: number | null;
  id_usuario: number | null;
  creado_en: string;
}

/** Observación del CDR: SUNAT aceptó pero con reparos que hay que corregir. */
export interface NotaCdr {
  codigo?: string;
  mensaje?: string;
  [key: string]: unknown;
}

export interface ComprobanteDetalle extends Comprobante {
  notas: NotaCdr[];
  /** Bitácora de envíos. Se llama `envios` y no `intentos` porque la cabecera
   *  ya usa `intentos` como contador. */
  envios: IntentoCpe[];
}

export interface ResumenCpe {
  total: number;
  aceptados: number;
  con_observaciones: number;
  rechazados: number;
  pendientes: number;
  con_error: number;
  inciertos: number;
  /** Ventas electrónicas ya cerradas que todavía no tienen comprobante. */
  sin_emitir: number;
}

/** Venta lista para emitir (aún sin CPE). */
export interface VentaSinCpe {
  id_venta: number;
  f_venta: string;
  num_comprobante: string;
  nom_tipocomp: string;
  [key: string]: unknown;
}

export interface ListaCpe {
  items: Comprobante[];
  total: number;
  page: number;
  limit: number;
}

export interface FiltrosCpe {
  estado?: string;
  tipo_doc?: string;
  desde?: string;
  hasta?: string;
  q?: string;
  page?: number;
  limit?: number;
}

/** Resultado de emitir o reintentar. */
export interface ResultadoEmision {
  id_cpe: number;
  estado: EstadoCpe;
  serie?: string;
  correlativo?: string;
  responseCode?: string | null;
  descripcion?: string | null;
  yaEmitido?: boolean;
  notas?: NotaCdr[];
}

/** Error de negocio del backend: `{ success: false, code, message }`. */
export interface ErrorCpeApi {
  code: string;
  message: string;
}
