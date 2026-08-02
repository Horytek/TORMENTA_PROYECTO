import api from "@/api/axios";
import type { GuidedTransfer, BlindCountSession, ReconciliationMatrixData } from "../types";

export const getGuidedTransfers = async (filters: { id_almacen?: number; estado?: string } = {}): Promise<GuidedTransfer[]> => {
  const res = await api.get("/inventory-movements/transfers", { params: filters });
  return res.data?.data || [];
};

export const createTransferRequest = async (payload: {
  id_almacen_origen: number;
  id_almacen_destino: number;
  glosa?: string;
  observaciones?: string;
  items: Array<{ id_sku: number; cantidad_solicitada: number; observacion_item?: string }>;
}): Promise<GuidedTransfer> => {
  const res = await api.post("/inventory-movements/transfers", payload);
  return res.data?.data;
};

export const dispatchTransfer = async (
  id_transferencia: number,
  items: Array<{ id_sku: number; cantidad_despachada: number }>
): Promise<GuidedTransfer> => {
  const res = await api.put(`/inventory-movements/transfers/${id_transferencia}/dispatch`, { items });
  return res.data?.data;
};

export const receiveTransfer = async (
  id_transferencia: number,
  items: Array<{ id_sku: number; cantidad_recibida: number }>
): Promise<GuidedTransfer> => {
  const res = await api.put(`/inventory-movements/transfers/${id_transferencia}/receive`, { items });
  return res.data?.data;
};

export const cancelTransfer = async (id_transferencia: number): Promise<void> => {
  await api.put(`/inventory-movements/transfers/${id_transferencia}/cancel`);
};

export const getBlindCountSessions = async (filters: { id_almacen?: number } = {}): Promise<BlindCountSession[]> => {
  const res = await api.get("/inventory-movements/blind-counts", { params: filters });
  return res.data?.data || [];
};

export const createBlindCountSession = async (payload: {
  id_almacen: number;
  titulo: string;
  observaciones?: string;
}): Promise<BlindCountSession> => {
  const res = await api.post("/inventory-movements/blind-counts", payload);
  return res.data?.data;
};

export const saveBlindCountItems = async (
  id_inventario_fisico: number,
  conteos: Array<{ id_sku: number; cantidad_contada: number; observacion_item?: string }>
): Promise<void> => {
  await api.put(`/inventory-movements/blind-counts/${id_inventario_fisico}/count`, { conteos });
};

export const getReconciliationMatrix = async (id_inventario_fisico: number): Promise<ReconciliationMatrixData> => {
  const res = await api.get(`/inventory-movements/blind-counts/${id_inventario_fisico}/reconcile`);
  return res.data?.data;
};

export const applyInventoryAdjustment = async (id_inventario_fisico: number): Promise<void> => {
  await api.post(`/inventory-movements/blind-counts/${id_inventario_fisico}/apply`);
};
