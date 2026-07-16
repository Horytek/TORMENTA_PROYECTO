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

/* ──────────────────────────────────────────────────────────
 * Detalle Kardex
 * ────────────────────────────────────────────────────────── */

/**
 * Productos asociados a un movimiento del kardex.
 * Este módulo trabaja contra las tablas "normales" (producto/marca/almacen), por lo que
 * NO se exponen los campos de variante (`attributes`, `sku_label`).
 */
export interface KardexProductoAgrupado {
  codigo: number;
  descripcion: string;
  marca: string | null;
  cantidad: number;
}

/** Movimiento individual o agrupado (nota/venta) del detalle (GET /kardex/detalleK). */
export interface KardexDetalleMovimiento {
  id: number;
  fecha: string;
  documento: string;
  nombre: string;
  entra: number;
  sale: number;
  stock: number;
  precio: number | string;
  glosa: string;
  hora_creacion?: string;
  usuario?: string;
  almacen_origen?: string;
  almacen_destino?: string;
  estado_doc?: number;
  is_grouped?: boolean;
  count_items?: number;
  productos?: KardexProductoAgrupado[];
}

/** Saldos anteriores al rango (GET /kardex/detalleKA). */
export interface KardexStockAnterior {
  numero: number;
  entra: number;
  sale: number;
}

/* ──────────────────────────────────────────────────────────
 * Stock mínimo
 * ────────────────────────────────────────────────────────── */

export interface KardexStockMinimo {
  codigo: number;
  nombre: string;
  marca: string | null;
  stock: number | string;
}

/* ──────────────────────────────────────────────────────────
 * Histórico por producto
 * ────────────────────────────────────────────────────────── */

export interface KardexProductoInfo {
  codigo: number;
  descripcion: string;
  marca: string | null;
  stock: number | string;
}

