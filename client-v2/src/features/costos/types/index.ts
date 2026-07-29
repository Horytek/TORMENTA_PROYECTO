/** Producto cuyo stock todavía no tiene costo declarado. */
export interface ProductoSinCosto {
  id_producto: number;
  descripcion: string;
  marca: string | null;
  /** Precio de VENTA. Sirve de referencia para no escribir un costo mayor. */
  precio: number | null;
  skus: number;
  skusSinCosto: number;
  unidades: number;
}

/** Qué tan confiable es hoy la valorización del inventario. */
export interface CoberturaCostos {
  valor: number;
  unidadesValorizadas: number;
  unidadesSinCosto: number;
  skusSinCosto: number;
  /** 100 = todo el stock tiene costo conocido. */
  cobertura: number;
}

export interface ItemCargaCosto {
  id_producto: number;
  costo: number;
}

export interface DetalleCarga {
  id_producto: number;
  costo: number | null;
  actualizados: number;
  omitidos: number;
  aviso?: string;
}

export interface ResultadoCarga {
  productos: number;
  skusActualizados: number;
  detalle: DetalleCarga[];
  cobertura: CoberturaCostos;
}

/** Totales del periodo. `ingresoConCosto` es la parte sobre la que el margen es real. */
export interface MargenTotal {
  lineas: number;
  lineasSinCosto: number;
  ingresoTotal: number;
  ingresoConCosto: number;
  costo: number;
  margen: number;
  porcentaje: number | null;
}

export interface MargenProducto {
  id_producto: number;
  descripcion: string;
  marca: string | null;
  unidades: number;
  unidadesConCosto: number;
  ingreso: number;
  costo: number;
  margen: number;
  porcentaje: number | null;
  /** Lo que el dueño pregunta: cuánto queda por prenda. */
  margenPorUnidad: number | null;
  /** false = parte de las unidades se vendió sin costo conocido. */
  completo: boolean;
}

export interface MargenResponse {
  total: MargenTotal;
  porProducto: MargenProducto[];
}
