export interface Brand {
  id_marca: number;
  nombre: string;
  estado?: number;
}

export interface Category {
  id_categoria: number;
  nombre: string;
  estado?: number;
}

export interface Subcategory {
  id_subcategoria: number;
  id_categoria: number;
  nombre_sub: string;
  nom_categoria?: string;
  estado?: number;
}

export interface UnitOfMeasure {
  id_unidad: number;
  nombre: string;
  simbolo: string;
  estado: number;
}

export interface Product {
  id_producto: number;
  descripcion: string;
  id_marca: number;
  id_subcategoria: number;
  nom_marca?: string;
  nom_subcat?: string;
  precio: number | string;
  cod_barras: string;
  undm: string;
  estado_producto: number;
  estado?: number;
  id_categoria?: number;
}

/** Una variante generada de un producto (tabla `producto_sku`). */
export interface ProductVariant {
  id_sku: number;
  id_producto: number;
  sku: string | null;
  cod_barras?: string | null;
  precio?: number | null;
  /** Stock en el almacén consultado (o total si no se filtró por almacén). */
  stock: number;
  id_almacen?: number | null;
  /** { id_atributo: valor } — snapshot guardado al generar el SKU. */
  attrs: Record<string, string>;
}

/** Atributo aplicable a un producto, con sus valores usados en sus SKUs. */
export interface ProductAttribute {
  id_atributo: number;
  nombre: string;
  tipo_input?: string;
  values?: AttributeValue[];
}

export interface AttributeValue {
  id_valor: number;
  id_atributo?: number;
  valor: string;
  hex?: string;
}

