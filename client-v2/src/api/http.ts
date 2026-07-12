import type { AxiosResponse } from "axios";

/**
 * Envoltura estándar de las respuestas del backend Horytek.
 * La mayoría responde `{ code, data, message }`; algunas legacy usan `{ success, data }`
 * o devuelven el recurso directo. Estos helpers normalizan esas variantes en un solo lugar.
 */
export interface ApiEnvelope<T = unknown> {
  code?: number;
  success?: boolean;
  data?: T;
  message?: string;
}

/** true si la operación fue exitosa (code 1/2, success, o `true` pelado). */
export const isOk = (res: AxiosResponse<ApiEnvelope | boolean>): boolean => {
  const d = res.data as ApiEnvelope | boolean;
  if (d === true) return true;
  if (typeof d === "object" && d !== null) {
    return d.code === 1 || d.code === 2 || d.success === true;
  }
  return false;
};

/** Extrae una lista, tolerando `{ data: [...] }` o un array pelado. */
export const unwrapList = <T>(res: AxiosResponse<ApiEnvelope<T[]> | T[]>): T[] => {
  const d = res.data as ApiEnvelope<T[]> | T[];
  const list = Array.isArray(d) ? d : d?.data;
  return Array.isArray(list) ? list : [];
};

/** Extrae un único recurso, tolerando `{ data }` o el recurso pelado. */
export const unwrapOne = <T>(res: AxiosResponse<ApiEnvelope<T> | T>): T | null => {
  const d = res.data as ApiEnvelope<T> | T;
  if (d && typeof d === "object" && "data" in (d as ApiEnvelope<T>)) {
    return ((d as ApiEnvelope<T>).data ?? null) as T | null;
  }
  return (d ?? null) as T | null;
};
