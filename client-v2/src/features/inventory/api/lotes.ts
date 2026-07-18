import api from "@/api/axios";
import type { Lote, LoteDetalle, LoteCreatePayload, VerificationConfig } from "../types";

interface ApiResponse<T> {
  code: number;
  data: T;
  message?: string;
}

export const getLotes = async (estado?: 0 | 1 | 2): Promise<Lote[]> => {
  const res = await api.get<ApiResponse<Lote[]>>("/lote", { params: estado !== undefined ? { estado } : {} });
  return res.data?.data ?? [];
};

export const getLoteDetalle = async (idLote: number): Promise<LoteDetalle[]> => {
  const res = await api.get<ApiResponse<LoteDetalle[]>>(`/lote/${idLote}`);
  return res.data?.data ?? [];
};

export const createLote = async (payload: LoteCreatePayload): Promise<{ success: boolean; message?: string; id_lote?: number }> => {
  try {
    const res = await api.post("/lote/create", payload);
    return { success: res.data?.code === 1, message: res.data?.message, id_lote: res.data?.id_lote };
  } catch (err) {
    const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
    return { success: false, message };
  }
};

export const verifyLote = async (idLote: number, idUsuario: number): Promise<{ success: boolean; message?: string }> => {
  try {
    const res = await api.post("/lote/verify", { id_lote: idLote, id_usuario: idUsuario });
    return { success: res.data?.code === 1, message: res.data?.message };
  } catch (err) {
    const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
    return { success: false, message };
  }
};

export const approveLote = async (
  idLote: number,
  idUsuario: number,
  almacenD: number | string,
  glosa: string
): Promise<{ success: boolean; message?: string }> => {
  try {
    const res = await api.post("/lote/approve", { id_lote: idLote, id_usuario: idUsuario, almacenD, glosa });
    return { success: res.data?.code === 1, message: res.data?.message };
  } catch (err) {
    const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
    return { success: false, message };
  }
};

export const getVerificationConfig = async (): Promise<VerificationConfig> => {
  const res = await api.get<ApiResponse<VerificationConfig>>("/config-verification");
  return res.data?.data ?? { verify: [], approve: [] };
};

export const updateVerificationConfig = async (config: VerificationConfig): Promise<boolean> => {
  const res = await api.post("/config-verification", config);
  return res.data?.code === 1;
};
