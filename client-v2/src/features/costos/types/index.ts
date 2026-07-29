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
