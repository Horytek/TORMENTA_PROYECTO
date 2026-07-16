import axios from "./axios";
import { unwrapList, type ApiEnvelope } from "./http";

/**
 * Notificación de actividad del sistema (log_sistema).
 * El backend devuelve filas crudas; el frontend decide cómo presentarlas.
 */
export interface Notificacion {
  id_log: number;
  accion: string;
  id_modulo: number | null;
  id_usuario: number | null;
  nombre_usuario: string | null;
  fecha: string; // ISO datetime
  descripcion: string | null;
  recurso: string | null;
}

/** Lista las últimas notificaciones del tenant autenticado. */
export const getNotificacionesRequest = async (
  limit = 20,
  offset = 0
): Promise<Notificacion[]> => {
  const res = await axios.get<ApiEnvelope<Notificacion[]> | Notificacion[]>(
    "/dashboard/notificaciones",
    { params: { limit, offset } }
  );
  return unwrapList<Notificacion>(res);
};