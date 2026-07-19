import api from "@/api/axios";
import { isOk, unwrapList } from "@/api/http";
import type { EmpresaSunat, EmpresaSunatInput } from "../types";

// Directorio de empresas (tabla `empresa`) para la pestaña SUNAT del panel
// Developer. Las claves API viven en features/account/api/account.ts (mismo
// recurso `/clave` que usa el drawer de Cuenta).

export const getEmpresasSunat = async (): Promise<EmpresaSunat[]> =>
  unwrapList<EmpresaSunat>(await api.get("/empresa"));

export const addEmpresa = async (input: EmpresaSunatInput): Promise<boolean> =>
  isOk(await api.post("/empresa", input));

export const updateEmpresa = async (id: number, input: EmpresaSunatInput): Promise<boolean> =>
  isOk(await api.put(`/empresa/${id}`, input));

export const deleteEmpresa = async (id: number): Promise<boolean> =>
  isOk(await api.delete(`/empresa/${id}`));
