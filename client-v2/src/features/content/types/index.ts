/** Tipo de entrada de un atributo dinámico. Mayúscula: coincide con los valores
 * reales ya guardados en producción (`atributo.tipo_input`), no normalizar a minúscula. */
export type TipoInput = "SELECT" | "COLOR" | "SIZE" | "TEXT" | "NUMBER";

export const TIPO_LABELS: Record<string, string> = {
  SELECT: "Selección",
  COLOR: "Color",
  SIZE: "Talla",
  TEXT: "Texto",
  NUMBER: "Número",
};

/** Atributo dinámico configurable por empresa (tabla `atributo`). */
export interface Attribute {
  id_atributo: number;
  nombre: string;
  codigo?: string;
  tipo_input: string;
  slug?: string;
  es_filtro?: number;
  es_visible?: number;
  es_requerido?: number;
  orden?: number;
}

export interface AttributeInput {
  nombre: string;
  tipo_input: TipoInput;
  es_filtro?: boolean;
  es_visible?: boolean;
  es_requerido?: boolean;
}

/** Metadata opcional del valor (p.ej. { hex } para colores). */
export interface ValueMetadata {
  hex?: string;
  [k: string]: unknown;
}

/** Valor de un atributo (tabla `atributo_valor`). */
export interface AttributeValue {
  id_valor: number;
  valor: string;
  metadata?: ValueMetadata | null;
  orden?: number;
}
