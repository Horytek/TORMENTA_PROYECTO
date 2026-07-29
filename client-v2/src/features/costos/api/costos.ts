import { AxiosError } from "axios";
import api from "@/api/axios";
import { unwrapList, unwrapOne } from "@/api/http";
import type { CoberturaCostos, ItemCargaCosto, ProductoSinCosto, ResultadoCarga } from "../types";

/**
 * Cliente de `/api/costos`. Responde `{ success, data }` y los errores de
 * validación llegan como 400 con `message` — que acá se propaga tal cual,
 * porque dice exactamente qué costo estaba mal.
 */

export const getCobertura = async (): Promise<CoberturaCostos | null> => {
  const res = await api.get("/costos/cobertura");
  return unwrapOne<CoberturaCostos>(res);
};

export const getProductosSinCosto = async (limite = 200): Promise<ProductoSinCosto[]> => {
  const res = await api.get("/costos/pendientes", { params: { limite } });
  return unwrapList<ProductoSinCosto>(res);
};

export const cargarCostosIniciales = async (
  items: ItemCargaCosto[],
  forzar = false
): Promise<ResultadoCarga | null> => {
  const res = await api.post("/costos/inicial", { items, forzar });
  return unwrapOne<ResultadoCarga>(res);
};

/** Mensaje del backend cuando rechaza la carga; si no hay, uno genérico. */
export const parseErrorCosto = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const msg = (error.response?.data as { message?: string } | undefined)?.message;
    if (msg) return msg;
  }
  return "No se pudo guardar los costos";
};
