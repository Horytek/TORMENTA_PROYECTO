import api from "@/api/axios";
import { unwrapList } from "@/api/http";
import type { Clave, ClaveInput, Funcion, Plan, EmpresaAccount } from "../types";

export type { EmpresaAccount };

export const getClaves = async (): Promise<Clave[]> => {
  try {
    return unwrapList<Clave>(await api.get("/clave"));
  } catch (err: any) {
    if (err?.response?.status === 403) return [];
    throw err;
  }
};

/** Upsert: el backend busca por (id_empresa, tipo) y actualiza o inserta. */
export const addClave = async (input: ClaveInput): Promise<boolean> => {
  const res = await api.post("/clave", input);
  return res.data?.code === 1;
};

/** Valor vacío o enmascarado (bullets) = el backend conserva el valor actual. */
export const updateClave = async (id: number, input: ClaveInput): Promise<boolean> => {
  const res = await api.put(`/clave/${id}`, input);
  return res.data?.code === 1;
};

export const deleteClave = async (id: number): Promise<boolean> => {
  const res = await api.delete(`/clave/${id}`);
  return res.data?.code === 1;
};

export const getFunciones = async (): Promise<Funcion[]> => {
  try {
    return unwrapList<Funcion>(await api.get("/funciones"));
  } catch (err: any) {
    if (err?.response?.status === 403) return [];
    throw err;
  }
};

export const getPlanes = async (): Promise<Plan[]> => {
  try {
    return unwrapList<Plan>(await api.get("/planes"));
  } catch (err: any) {
    if (err?.response?.status === 403) return [];
    throw err;
  }
};

/** Empresa completa (tabla `empresa`), para precargar el formulario de Cuenta. */
export const getEmpresaAccount = async (idEmpresa: number | string): Promise<EmpresaAccount | null> => {
  const res = await api.get(`/empresa/${idEmpresa}`);
  const row = res.data?.data;
  const empresa = Array.isArray(row) ? row[0] : row;
  return empresa ?? null;
};

export const updateEmpresaAccount = async (
  idEmpresa: number | string,
  fields: { ruc?: string; razonSocial?: string; direccion?: string; logotipo?: string }
): Promise<boolean> => {
  const res = await api.put(`/empresa/${idEmpresa}`, fields);
  return res.data?.code === 1;
};

/** Sube un logo a ImageKit (base64) y devuelve la URL pública. */
export const uploadLogoBase64 = async (base64: string): Promise<string> => {
  const res = await api.post("/uploads/logo", { file: base64 });
  if (!res.data?.success) throw new Error(res.data?.message ?? "Error subiendo logotipo");
  return res.data.url as string;
};
