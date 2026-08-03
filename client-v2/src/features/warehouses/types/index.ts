/** Almacén tal como lo devuelve el backend (GET /almacen). */
export interface Almacen {
  id_almacen: number;
  nom_almacen: string;
  ubicacion?: string;
  estado_almacen: number; // 1 = activo, 0 = inactivo
  id_sucursal?: number | null;
  nombre_sucursal?: string;
  /** Suma de stock de todos los SKU en este almacén; ya lo calcula el backend. */
  stock_total?: number | string;
}

/** Opción de sucursal para asignar al almacén (GET /almacen/sucursales). */
export interface SucursalOption {
  id_sucursal: number;
  nombre_sucursal: string;
  disponible?: number;
}

export interface AlmacenInput {
  id?: number; // solo update
  nom_almacen: string;
  ubicacion: string;
  id_sucursal: number | null;
  estado_almacen?: number;
}
