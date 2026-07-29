import api from "@/api/axios";
import type { Cliente, ClienteInput, CompraCliente, HistorialCliente, CuentaPorCobrar, RegistrarCobroInput } from "../types";

// El backend responde con { code, data } o directamente el recurso.
const unwrap = <T>(res: { data: any }, fallback: T): T => {
  const data = res.data;
  if (data?.data) return data.data;
  return data?.success ? data.data : (data ?? fallback);
};

const ok = (res: { data: any }): boolean => {
  const data = res.data;
  return data?.code === 1 || data?.code === 2 || data?.success === true || data === true;
};

export const getClientes = async (params?: { searchTerm?: string; limit?: number }): Promise<Cliente[]> => {
  const res = await api.get("/clientes", { params });
  const list = unwrap<Cliente[]>(res, []);
  return Array.isArray(list) ? list : [];
};

export const createCliente = async (input: ClienteInput): Promise<boolean> => {
  const res = await api.post("/clientes", input);
  return ok(res);
};

export const updateCliente = async (input: ClienteInput): Promise<boolean> => {
  const res = await api.put("/clientes/updateCliente", input);
  return ok(res);
};

export const deleteCliente = async (id: number): Promise<boolean> => {
  const res = await api.delete(`/clientes/deleteCliente/${id}`);
  return ok(res);
};

export const deactivateCliente = async (id: number): Promise<boolean> => {
  const res = await api.put(`/clientes/deactivateCliente/${id}`);
  return ok(res);
};

export const getComprasCliente = async (idCliente: number): Promise<CompraCliente[]> => {
  const res = await api.get("/clientes/compras", { params: { id_cliente: idCliente, limit: 20 } });
  return res.data?.data ?? [];
};

export const getHistorialCliente = async (idCliente: number): Promise<HistorialCliente[]> => {
  const res = await api.get("/clientes/historial", { params: { id_cliente: idCliente, limit: 15 } });
  return res.data?.data ?? [];
};

// ── Cuentas por cobrar (crédito) ──────────────────────────────────
export const getCuentasPorCobrarCliente = async (idCliente: number): Promise<CuentaPorCobrar[]> => {
  const res = await api.get("/clientes/cuentas-por-cobrar", { params: { id_cliente: idCliente } });
  return res.data?.data ?? [];
};

export const registrarCobroCuenta = async (idCuenta: number, input: RegistrarCobroInput): Promise<boolean> => {
  const res = await api.post(`/clientes/cuentas-por-cobrar/${idCuenta}/pagos`, input);
  return res.data?.success === true;
};
