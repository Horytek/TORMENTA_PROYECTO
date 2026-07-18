import api from "@/api/axios";
import { unwrapList } from "@/api/http";
import type { Clave, ClaveInput, Funcion, Plan, EmpresaAccount } from "../types";

export type { EmpresaAccount };

export const getClaves = async (): Promise<Clave[]> => unwrapList<Clave>(await api.get("/clave"));

/** Upsert: el backend busca por (id_empresa, tipo) y actualiza o inserta. */
export const addClave = async (input: ClaveInput): Promise<boolean> => {
  const res = await api.post("/clave", input);
  return res.data?.code === 1;
};

export const getFunciones = async (): Promise<Funcion[]> => unwrapList<Funcion>(await api.get("/funciones"));

export const getPlanes = async (): Promise<Plan[]> => unwrapList<Plan>(await api.get("/planes"));

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

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

/** Sube un logo a ImageKit (base64) y devuelve la URL pública. */
export const uploadLogoBase64 = async (base64: string): Promise<string> => {
  const res = await api.post("/uploads/logo", { file: base64 });
  if (!res.data?.success) throw new Error(res.data?.message ?? "Error subiendo logotipo");
  return res.data.url as string;
};

export const fileToBase64Payload = fileToBase64;
