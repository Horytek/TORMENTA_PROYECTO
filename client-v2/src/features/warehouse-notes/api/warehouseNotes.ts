import { isAxiosError } from "axios";
import api from "@/api/axios";
import { unwrapList } from "@/api/http";
import type {
  WarehouseNote,
  NotaFiltros,
  NotaAlmacen,
  Destination,
  DocumentType,
  NotaProducto,
  NotaInsertPayload,
  NotaInsertResult,
} from "../types";

/** Quita claves vacías/indefinidas antes de mandarlas como querystring. */
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

// ─────────────────────────────────────────────────────────────────
// Ingresos
// ─────────────────────────────────────────────────────────────────

export const getNotasIngreso = async (filtros: NotaFiltros = {}): Promise<WarehouseNote[]> =>
  unwrapList<WarehouseNote>(await api.get("/nota_ingreso", { params: cleanParams(filtros) }));

export const insertNotaIngreso = async (data: NotaInsertPayload): Promise<NotaInsertResult> => {
  try {
    const res = await api.post("/nota_ingreso/addNota", data);
    return { success: res.data?.code === 1, message: res.data?.message };
  } catch (err) {
    return { success: false, message: extractErrorMessage(err) };
  }
};

export const anularNotaIngreso = async (notaId: number, usuario: string): Promise<boolean> => {
  const res = await api.post("/nota_ingreso/anular", { notaId, usuario });
  return res.data?.code === 1;
};

export const getAlmacenesIngreso = async (): Promise<NotaAlmacen[]> =>
  unwrapList<NotaAlmacen>(await api.get("/nota_ingreso/almacen"));

export const getDestinatariosIngreso = async (): Promise<Destination[]> =>
  unwrapList<Destination>(await api.get("/nota_ingreso/destinatario"));

export const getDocumentosIngreso = async (): Promise<DocumentType[]> =>
  unwrapList<DocumentType>(await api.get("/nota_ingreso/ndocumento"));

export const getProductosIngreso = async (filtros: {
  descripcion?: string;
  almacen?: string | number;
  cod_barras?: string;
}): Promise<NotaProducto[]> =>
  unwrapList<NotaProducto>(await api.get("/nota_ingreso/productos", { params: cleanParams(filtros) }));

// ─────────────────────────────────────────────────────────────────
// Salidas
// ─────────────────────────────────────────────────────────────────

export const getNotasSalida = async (filtros: NotaFiltros = {}): Promise<WarehouseNote[]> =>
  unwrapList<WarehouseNote>(await api.get("/nota_salida", { params: cleanParams(filtros) }));

/** OJO: la ruta real registrada en el backend es `/nuevanota`, no `/addNota` (bug del legacy, no lo repitas). */
export const insertNotaSalida = async (data: NotaInsertPayload): Promise<NotaInsertResult> => {
  try {
    const res = await api.post("/nota_salida/nuevanota", data);
    return { success: res.data?.code === 1, message: res.data?.message };
  } catch (err) {
    return { success: false, message: extractErrorMessage(err) };
  }
};

export const anularNotaSalida = async (notaId: number, usuario: string): Promise<boolean> => {
  const res = await api.post("/nota_salida/anular", { notaId, usuario });
  return res.data?.code === 1;
};

export const getAlmacenesSalida = async (): Promise<NotaAlmacen[]> =>
  unwrapList<NotaAlmacen>(await api.get("/nota_salida/almacen"));

export const getDestinatariosSalida = async (): Promise<Destination[]> =>
  unwrapList<Destination>(await api.get("/nota_salida/destinatario"));

export const getDocumentosSalida = async (): Promise<DocumentType[]> =>
  unwrapList<DocumentType>(await api.get("/nota_salida/nuevodocumento"));

export const getProductosSalida = async (filtros: {
  descripcion?: string;
  almacen?: string | number;
  cod_barras?: string;
}): Promise<NotaProducto[]> =>
  unwrapList<NotaProducto>(await api.get("/nota_salida/productos", { params: cleanParams(filtros) }));
