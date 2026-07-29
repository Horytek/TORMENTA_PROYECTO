import api from "@/api/axios";
import type { Vendedor, VendedorInput, VendedorUpdate, ComisionVendedor } from "../types";

interface ApiResponse<T> {
  code: number;
  data?: T;
  message?: string;
}

const unwrap = <T>(res: { data: ApiResponse<T> }): T => res.data.data ?? ([] as unknown as T);

const isOk = (res: { data: ApiResponse<unknown> }): boolean =>
  res.data.code === 1 || res.data.code === 2;

export const getVendedores = async (): Promise<Vendedor[]> => {
  const res = await api.get<ApiResponse<Vendedor[]>>("/vendedores");
  return unwrap(res);
};

export const getVendedor = async (dni: string): Promise<Vendedor> => {
  const res = await api.get<ApiResponse<Vendedor>>(`/vendedores/${dni}`);
  return unwrap(res);
};

export const createVendedor = async (input: VendedorInput): Promise<boolean> => {
  const res = await api.post<ApiResponse<unknown>>("/vendedores", input);
  return isOk(res);
};

export const updateVendedor = async (dni: string, input: VendedorUpdate): Promise<boolean> => {
  const res = await api.put<ApiResponse<unknown>>(`/vendedores/update/${dni}`, input);
  return isOk(res);
};

export const deactivateVendedor = async (dni: string): Promise<boolean> => {
  const res = await api.put<ApiResponse<unknown>>(`/vendedores/deactivate/${dni}`);
  return isOk(res);
};

export const reactivateVendedor = async (dni: string): Promise<boolean> => {
  const res = await api.put<ApiResponse<unknown>>(`/vendedores/reactivate/${dni}`);
  return isOk(res);
};

export const deleteVendedor = async (dni: string): Promise<boolean> => {
  const res = await api.delete<ApiResponse<unknown>>(`/vendedores/${dni}`);
  return isOk(res);
};

export const getComisiones = async (params: { fecha_inicio?: string; fecha_fin?: string }): Promise<ComisionVendedor[]> => {
  const res = await api.get<ApiResponse<ComisionVendedor[]>>("/vendedores/comisiones", { params });
  return unwrap(res);
};
