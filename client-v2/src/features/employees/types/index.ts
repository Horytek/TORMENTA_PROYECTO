export interface Vendedor {
  dni: string;
  id_usuario: number;
  nombre: string;       // CONCAT(nombres, ' ', apellidos) — viene del backend
  nombres: string;
  apellidos: string;
  telefono: string;
  usua?: string;        // nombre de usuario
  estado_vendedor: number; // 1 = activo, 0 = inactivo
  /** % de comisión sobre sus ventas; null = sin comisión configurada. */
  porcentaje_comision?: number | string | null;
  /** Objetivo de venta mensual (S/.); null = sin meta configurada. */
  meta_mensual?: number | string | null;
  /** Sucursal donde está asignado como responsable; null = sin sucursal asignada. */
  nombre_sucursal?: string | null;
}

export interface VendedorInput {
  dni: string;
  id_usuario: number;
  nombres: string;
  apellidos: string;
  telefono?: string;
  estado_vendedor?: number;
  porcentaje_comision?: number | null;
  meta_mensual?: number | null;
}

export interface VendedorUpdate extends VendedorInput {
  nuevo_dni?: string;
}

/** GET /vendedores/comisiones?fecha_inicio=&fecha_fin=. */
export interface ComisionVendedor {
  dni: string;
  nombre: string;
  porcentaje_comision: number | string | null;
  meta_mensual: number | string | null;
  cantidad_ventas: number;
  total_ventas: number | string;
  comision: number | string | null;
  /** % de avance de total_ventas sobre meta_mensual; null si no hay meta configurada. */
  pct_meta: number | string | null;
}
