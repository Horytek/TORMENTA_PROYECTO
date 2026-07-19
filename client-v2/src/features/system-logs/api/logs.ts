import api from "@/api/axios";
import type { SystemLog } from "../types";

export interface SystemLogsResponse {
  rows: SystemLog[];
  total: number;
}

/**
 * GET /logs — el backend pagina server-side pero devuelve `{ code, data, total }`
 * (no la envoltura estándar). Se trae un lote grande y se filtra/pagina en el
 * cliente, igual que hacía el cliente v1.
 */
export const getSystemLogs = async (page = 1, limit = 1000): Promise<SystemLogsResponse> => {
  const res = await api.get("/logs", { params: { page, limit } });
  const d = res.data ?? {};
  const rows: SystemLog[] = Array.isArray(d.data) ? d.data : [];
  return { rows, total: Number(d.total ?? rows.length) };
};
