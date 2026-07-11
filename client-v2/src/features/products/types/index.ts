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

export interface ProductVariant {
  id_variante: number;
  id_producto: number;
  sku: string;
  codigo_barra?: string;
  precio_adicional?: number;
  stock?: number;
  atributos?: string; // string representation of variant attributes e.g., "Color: Rojo, Talla: M"
}

export interface ProductAttribute {
  id_atributo: number;
  nombre: string;
  tipo_input: string;
  values?: AttributeValue[];
}

export interface AttributeValue {
  id_valor: number;
  id_atributo: number;
  valor: string;
}
