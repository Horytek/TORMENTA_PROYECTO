import api from "@/api/axios";
import { isOk, unwrapList } from "@/api/http";
import type { Attribute, AttributeInput, AttributeValue, ValueMetadata } from "../types";

const parseMeta = (m: unknown): ValueMetadata | null => {
  if (!m) return null;
  if (typeof m === "object") return m as ValueMetadata;
  if (typeof m === "string") {
    try {
      return JSON.parse(m) as ValueMetadata;
    } catch {
      return null;
    }
  }
  return null;
};

// ── Atributos ────────────────────────────────────────────────
export const getAttributes = async (): Promise<Attribute[]> =>
  unwrapList<Attribute>(await api.get("/attributes"));

export const createAttribute = async (input: AttributeInput): Promise<boolean> =>
  isOk(await api.post("/attributes", input));

export const updateAttribute = async (id: number, input: AttributeInput): Promise<boolean> =>
  isOk(await api.put(`/attributes/${id}`, input));

/** `ids` en el orden final deseado (todos los atributos del tenant, no solo los movidos). */
export const reorderAttributes = async (ids: number[]): Promise<boolean> =>
  isOk(await api.put("/attributes/reorder", { ids }));

export interface AttributeImpact {
  productos: number;
  variantes: number;
  categorias: number;
  lineasVenta: number;
}

export const getAttributeImpact = async (id: number): Promise<AttributeImpact> => {
  const response = await api.get(`/attributes/${id}/impact`);
  return response.data?.data ?? { productos: 0, variantes: 0, categorias: 0, lineasVenta: 0 };
};

// ── Valores ──────────────────────────────────────────────────
export const getAttributeValues = async (idAtributo: number): Promise<AttributeValue[]> =>
  unwrapList<Record<string, unknown>>(await api.get(`/attributes/${idAtributo}/values`)).map((v) => ({
    id_valor: v.id_valor as number,
    valor: v.valor as string,
    metadata: parseMeta(v.metadata),
  }));

export const createAttributeValue = async (
  idAtributo: number,
  valor: string,
  metadata?: ValueMetadata | null
): Promise<boolean> => isOk(await api.post(`/attributes/${idAtributo}/values`, { valor: valor.trim(), metadata: metadata ?? null }));

export const updateAttributeValue = async (
  idValor: number,
  valor: string,
  metadata?: ValueMetadata | null
): Promise<boolean> => isOk(await api.put(`/attributes/values/${idValor}`, { valor: valor.trim(), metadata: metadata ?? null }));

export const deleteAttributeValue = async (idValor: number): Promise<boolean> =>
  isOk(await api.delete(`/attributes/values/${idValor}`));

/** `ids` en el orden final deseado (todos los valores de ese atributo). */
export const reorderAttributeValues = async (idAtributo: number, ids: number[]): Promise<boolean> =>
  isOk(await api.put(`/attributes/${idAtributo}/values/reorder`, { ids }));

// ── Plantillas por categoría (qué atributos aplican a cada categoría) ──
export const getCategoryAttributeIds = async (idCategoria: number): Promise<number[]> => {
  const list = unwrapList<{ id_atributo: number }>(await api.get(`/attributes/category/${idCategoria}`));
  return list.map((a) => a.id_atributo);
};

export const linkCategoryAttributes = async (idCategoria: number, attributeIds: number[]): Promise<boolean> =>
  isOk(await api.post("/attributes/link-category", { id_categoria: idCategoria, attribute_ids: attributeIds }));
