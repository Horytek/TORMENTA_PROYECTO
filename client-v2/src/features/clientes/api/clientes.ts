import api from "@/api/axios";
import type { Cliente, ClienteInput } from "../types";

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

export const getClientes = async (): Promise<Cliente[]> => {
  const res = await api.get("/clientes");
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
