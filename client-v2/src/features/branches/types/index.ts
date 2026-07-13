/** Sucursal tal como la devuelve el backend (GET /sucursales/). */
export interface Sucursal {
  id_sucursal: number;
  nombre_sucursal: string;
  ubicacion?: string;
  estado_sucursal: number; // 1 = activa, 0 = inactiva
  dni?: string;
  /** Nombre del vendedor asignado (viene por join). */
  nombre_completo?: string;
  nombres?: string;
}

/** Vendedor activo (GET /sucursales/vendedores) para asignar a la sucursal. */
export interface Vendedor {
  dni: string;
  nombre_completo: string;
}

/** Payload para crear/actualizar. El insert exige `dni` de un vendedor activo. */
export interface SucursalInput {
  id?: number; // solo update
  dni?: string;
  nombre_sucursal: string;
  ubicacion: string;
  estado_sucursal?: number;
}

export const sucursalVendedor = (s: Sucursal): string =>
  s.nombre_completo?.trim() || s.nombres?.trim() || (s.dni ? `DNI ${s.dni}` : "Sin asignar");
