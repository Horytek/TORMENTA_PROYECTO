/** Fila de existencias por producto (GET /kardex/). */
export interface KardexProducto {
  codigo: number;
  descripcion: string;
  marca?: string;
  stock: number;
  um?: string;
  precio?: number | string;
  cod_barras?: string;
  estado?: number;
}

/** Almacén para el filtro (GET /kardex/almacen). */
export interface KardexAlmacen {
  id_almacen: number;
  nom_almacen: string;
}

export type StockFilter = "todos" | "con_stock" | "sin_stock";
