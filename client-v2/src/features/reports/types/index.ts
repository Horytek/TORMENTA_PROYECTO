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
