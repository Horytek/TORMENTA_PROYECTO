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

