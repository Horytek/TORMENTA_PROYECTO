/** Registro de auditoría tal como lo devuelve el backend (GET /logs). */
export interface SystemLog {
  id_log: number;
  fecha: string;
  /** Nombre de usuario (puede venir nulo en eventos de sistema). */
  usua?: string | null;
  id_usuario?: number | string | null;
  accion: string;
  descripcion?: string | null;
  ip?: string | null;
  recurso?: string | null;
  id_modulo?: number | null;
  id_submodulo?: number | null;
}

/** Período de tiempo para filtrar los logs (client-side). */
export type LogPeriodo = "24h" | "semana" | "mes" | "anio";
