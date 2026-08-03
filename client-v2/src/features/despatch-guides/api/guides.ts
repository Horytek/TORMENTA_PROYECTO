import { isAxiosError } from "axios";
import api from "@/api/axios";
import { unwrapList } from "@/api/http";
import type {
  Guide,
  GuideFiltros,
  GuideSucursal,
  GuideUbigeo,
  GuideDestinatario,
  GuideDocumento,
  GuideProducto,
  TransportistaPublico,
  TransportistaPrivado,
  Vehiculo,
  GuideInsertPayload,
  GuideInsertResult,
  NewDestinatarioNaturalInput,
  NewDestinatarioJuridicoInput,
  NewTransportistaPublicoInput,
  NewTransportistaPrivadoInput,
  NewVehiculoInput,
  EmpresaSunatData,
} from "../types";

const cleanParams = <T extends object>(params: T): Record<string, unknown> => {
  const cleaned: Record<string, unknown> = {};
  Object.entries(params as Record<string, unknown>).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== "") cleaned[key] = val;
  });
  return cleaned;
};

const extractErrorMessage = (err: unknown): string | undefined => {
  if (isAxiosError(err)) return err.response?.data?.message;
  return undefined;
};

interface GuiasResponse {
  code: number;
  data: Guide[];
  totalGuias: number;
}

export const getGuias = async (filtros: GuideFiltros = {}): Promise<{ data: Guide[]; total: number }> => {
  const res = await api.get<GuiasResponse>("/guia_remision", { params: cleanParams(filtros) });
  return { data: res.data?.data ?? [], total: res.data?.totalGuias ?? 0 };
};

export const anularGuia = async (guiaId: number, usuario: string): Promise<boolean> => {
  const res = await api.post("/guia_remision/anularguia", { guiaId, usuario });
  return res.data?.code === 1;
};

export const generarDocumentoGuia = async (): Promise<GuideDocumento> => {
  const res = await api.get("/guia_remision/num_comprobante");
  const row = res.data?.data;
  return Array.isArray(row) ? row[0] : row;
};

export const insertGuiaRemisionAndDetalle = async (data: GuideInsertPayload): Promise<GuideInsertResult> => {
  try {
    const res = await api.post("/guia_remision/nuevaguia", data);
    return { success: res.data?.code === 1, message: res.data?.message, id_guiaremision: res.data?.id_guiaremision };
  } catch (err) {
    return { success: false, message: extractErrorMessage(err) };
  }
};

export const getSucursalesGuia = async (): Promise<GuideSucursal[]> =>
  unwrapList<GuideSucursal>(await api.get("/guia_remision/sucursal"));

export const getUbigeosGuia = async (): Promise<GuideUbigeo[]> =>
  unwrapList<GuideUbigeo>(await api.get("/guia_remision/ubigeo"));

export const getDestinatariosGuia = async (): Promise<GuideDestinatario[]> =>
  unwrapList<GuideDestinatario>(await api.get("/guia_remision/clienteguia"));

export const getProductosGuia = async (filtros: { descripcion?: string; codbarras?: string; almacen?: number | string } = {}): Promise<GuideProducto[]> =>
  unwrapList<GuideProducto>(await api.get("/guia_remision/productos", { params: cleanParams(filtros) }));

export const getTransportistasPublicos = async (): Promise<TransportistaPublico[]> =>
  unwrapList<TransportistaPublico>(await api.get("/guia_remision/transpublico"));

export const getTransportistasPrivados = async (): Promise<TransportistaPrivado[]> =>
  unwrapList<TransportistaPrivado>(await api.get("/guia_remision/transprivado"));

export const generarCodigoTransportista = async (): Promise<string> => {
  const res = await api.get("/guia_remision/cod_transporte");
  const row = res.data?.data;
  const item = Array.isArray(row) ? row[0] : row;
  return item?.nuevo_codigo_trans ?? "";
};

export const getVehiculos = async (): Promise<Vehiculo[]> =>
  unwrapList<Vehiculo>(await api.get("/guia_remision/vehiculosguia"));

export const addVehiculo = async (data: NewVehiculoInput): Promise<{ success: boolean; message?: string }> => {
  try {
    const res = await api.post("/guia_remision/nuevo_vehiculo", data);
    return { success: res.data?.code === 1, message: res.data?.message };
  } catch (err) {
    return { success: false, message: extractErrorMessage(err) };
  }
};

export const addTransportistaPublico = async (
  data: NewTransportistaPublicoInput
): Promise<{ success: boolean; message?: string }> => {
  try {
    const res = await api.post("/guia_remision/nuevo_transportepub", data);
    return { success: res.data?.code === 1, message: res.data?.message };
  } catch (err) {
    return { success: false, message: extractErrorMessage(err) };
  }
};

export const addTransportistaPrivado = async (
  data: NewTransportistaPrivadoInput
): Promise<{ success: boolean; message?: string }> => {
  try {
    const res = await api.post("/guia_remision/nuevo_transportepriv", data);
    return { success: res.data?.code === 1, message: res.data?.message };
  } catch (err) {
    return { success: false, message: extractErrorMessage(err) };
  }
};

export const addDestinatarioNatural = async (
  data: NewDestinatarioNaturalInput
): Promise<{ success: boolean; message?: string; id_destinatario?: number }> => {
  try {
    const res = await api.post("/guia_remision/destnatural", data);
    return { success: res.data?.code === 1, message: res.data?.message, id_destinatario: res.data?.id_destinatario };
  } catch (err) {
    return { success: false, message: extractErrorMessage(err) };
  }
};

export const addDestinatarioJuridico = async (
  data: NewDestinatarioJuridicoInput
): Promise<{ success: boolean; message?: string; id_destinatario?: number }> => {
  try {
    const res = await api.post("/guia_remision/destjuridico", data);
    return { success: res.data?.code === 1, message: res.data?.message, id_destinatario: res.data?.id_destinatario };
  } catch (err) {
    return { success: false, message: extractErrorMessage(err) };
  }
};

/**
 * Datos completos de la empresa del tenant, para el payload de SUNAT.
 * `/negocio` (usado por Ajustes) no expone razonSocial ni ubigueo, así que
 * se consulta `/empresa/:id` directo, igual que hacía el cliente legado.
 */
export const getEmpresaSunatData = async (idEmpresa: number | string): Promise<EmpresaSunatData | null> => {
  const res = await api.get(`/empresa/${idEmpresa}`);
  const row = res.data?.data;
  const empresa = Array.isArray(row) ? row[0] : row;
  return empresa ?? null;
};
