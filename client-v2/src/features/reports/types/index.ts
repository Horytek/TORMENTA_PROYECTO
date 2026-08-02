export interface SucursalReporte {
  id_sucursal: number;
  nombre: string;
}

export interface TendenciaVenta {
  fecha: string;
  total_ventas: number | string;
}

export interface ProductoVendido {
  id_producto: number;
  descripcion: string;
  cantidad_vendida: number | string;
  dinero_generado: number | string;
}

export interface ProductoMargen {
  nombre: string;
  margen: number | string;
  ventas: string;
}

export interface GananciaSucursal {
  sucursal: string;
  mes: string;
  anio: number;
  mes_num: number;
  ganancias: number | string;
}

export interface ReporteFiltros {
  id_sucursal?: string;
  year?: string;
  month?: string;
  week?: string;
  limit?: number;
}

export type RangoAntiguedad = "0-30" | "31-60" | "61-90" | "90+" | "Sin dato";

export interface StockAgingItem {
  id_producto: number;
  descripcion: string;
  nom_marca: string | null;
  categoria: string | null;
  stock: number;
  dias_sin_movimiento: number | null;
  rango: RangoAntiguedad;
}

/** `dia_semana`: 1=domingo…7=sábado (convención DAYOFWEEK de MySQL). */
export interface VentaHeatmapPunto {
  dia_semana: number;
  hora: number;
  ventas: number;
}
