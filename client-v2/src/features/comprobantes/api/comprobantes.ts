import { AxiosError } from "axios";
import api from "@/api/axios";
import type {
  Comprobante,
  ComprobanteDetalle,
  ErrorCpeApi,
  FiltrosCpe,
  ListaCpe,
  ResultadoEmision,
  ResumenCpe,
  VentaSinCpe,
} from "../types";

/**
 * Cliente de `/api/cpe`. Todos los endpoints responden `{ success, data }`, y
 * los errores de negocio `{ success: false, code, message }` con el status
 * correcto — así que acá se propaga el `code` para que la UI pueda explicar
 * *por qué* no se pudo emitir (no todos los fallos son reintentables).
 */

/** Convierte el error de axios en el `{ code, message }` del backend. */
export function parseErrorCpe(error: unknown): ErrorCpeApi {
  if (error instanceof AxiosError) {
    const data = error.response?.data as Partial<ErrorCpeApi> | undefined;
    if (data?.code) return { code: data.code, message: data.message ?? "No se pudo completar la operación" };
    if (error.code === "ECONNABORTED") {
      return { code: "CPE_TIMEOUT", message: "SUNAT no respondió a tiempo. Revisa el estado antes de reintentar." };
    }
  }
  return { code: "CPE_ERROR_DESCONOCIDO", message: "Error inesperado al comunicarse con el servidor" };
}

export const getComprobantes = async (filtros: FiltrosCpe = {}): Promise<ListaCpe> => {
  const { data } = await api.get("/cpe", { params: filtros });
  return data?.data ?? { items: [], total: 0, page: 1, limit: 25 };
};

export const getResumenCpe = async (filtros: Pick<FiltrosCpe, "desde" | "hasta"> = {}): Promise<ResumenCpe> => {
  const { data } = await api.get("/cpe/resumen", { params: filtros });
  const r = data?.data ?? {};
  // El SUM() de MySQL vuelve como string (o null si no hay filas): normalizar a número.
  const n = (v: unknown) => Number(v ?? 0) || 0;
  return {
    total: n(r.total),
    aceptados: n(r.aceptados),
    con_observaciones: n(r.con_observaciones),
    rechazados: n(r.rechazados),
    pendientes: n(r.pendientes),
    con_error: n(r.con_error),
    inciertos: n(r.inciertos),
    sin_emitir: n(r.sin_emitir),
  };
};

export const getVentasSinComprobante = async (
  filtros: Pick<FiltrosCpe, "desde" | "hasta" | "limit"> = {}
): Promise<VentaSinCpe[]> => {
  const { data } = await api.get("/cpe/pendientes", { params: filtros });
  return Array.isArray(data?.data) ? data.data : [];
};

export const getComprobante = async (idCpe: number): Promise<ComprobanteDetalle> => {
  const { data } = await api.get(`/cpe/${idCpe}`);
  return data?.data;
};

export const getComprobantePorVenta = async (idVenta: number): Promise<Comprobante | null> => {
  const { data } = await api.get(`/cpe/venta/${idVenta}`);
  return data?.data ?? null;
};

/**
 * Emite el comprobante de una venta. El backend es idempotente: si la venta ya
 * tiene un comprobante aceptado devuelve ese mismo (`yaEmitido: true`) sin
 * volver a llamar a SUNAT ni consumir correlativo.
 *
 * El timeout se sube a 3 minutos porque SUNAT beta llega a tardar minutos; el
 * `Idempotency-Key` permite que un reintento del cliente no genere un segundo
 * envío si la respuesta se perdió en el camino.
 */
export const emitirComprobante = async (
  idVenta: number,
  idempotencyKey?: string
): Promise<ResultadoEmision> => {
  const { data } = await api.post(
    "/cpe/emitir",
    { id_venta: idVenta },
    {
      timeout: 180_000,
      headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
    }
  );
  return data?.data;
};

/** Reintenta un envío fallido. Solo aplica a PENDIENTE / ERROR_ENVIO / ERROR_CONFIG. */
export const reintentarComprobante = async (idCpe: number): Promise<ResultadoEmision> => {
  const { data } = await api.post(`/cpe/${idCpe}/reintentar`, {}, { timeout: 180_000 });
  return data?.data;
};

/** Descarga el XML firmado o el CDR y dispara el "guardar como" del navegador. */
export const descargarArchivoCpe = async (
  idCpe: number,
  tipo: "xml" | "cdr",
  nombreArchivo: string
): Promise<void> => {
  const { data } = await api.get(`/cpe/${idCpe}/${tipo}`, { responseType: "blob" });
  const url = URL.createObjectURL(new Blob([data], { type: "application/xml" }));
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = tipo === "xml" ? `${nombreArchivo}.xml` : `R-${nombreArchivo}.xml`;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
};
