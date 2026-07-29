// ─── Producto en el catálogo de inventario ────────────────────────
export interface InventarioProducto {
  codigo: number;
  descripcion: string;
  marca: string;
  stock: number;
  um: string;
  precio: number;
  cod_barras: string | null;
  estado: number;
  /** Costo promedio ponderado (agregado entre SKUs); null si no hay ingresos con costo registrados. */
  costo_promedio?: number | string | null;
}

// ─── Histórico de kardex (movimientos por producto + rango fechas) ──
/** Sub-item de una transacción agrupada (una nota/venta puede incluir varios productos). */
export interface KardexTransaccionProducto {
  codigo: number;
  descripcion: string;
  marca: string;
  cantidad: number;
}

/**
 * Transacción de kardex — GET /kardex/detalleK. El backend agrupa todos los movimientos
 * de una misma nota/venta en una sola fila (`productos` trae el detalle por producto).
 *
 * NOTA: este módulo opera contra las tablas "normales" (`producto`, `marca`, `almacen`).
 * Por eso NO se exponen aquí los campos relacionados con variantes
 * (`tonalidad`, `talla`, `sku_label`, `sku_attrs`, `id_sku`, etc.) — la BD aún los tiene
 * en `producto_sku`/`tonalidad`/`talla`, pero el cliente los ignora para mantener la
 * capa de presentación simple y enfocada en el kardex por producto.
 */
export interface KardexTransaccion {
  id: number;
  fecha: string;               // ya formateada dd/mm/yyyy
  documento: string;
  nombre: string;               // tipo de operación (nombre de la nota, "Venta", etc.)
  entra: number;
  sale: number;
  stock: number;                // stock acumulado tras la transacción (según backend)
  precio: number | null;
  glosa: string;
  hora_creacion: string | null;
  usuario: string;
  almacen_origen: string;
  almacen_destino: string;
  estado_doc: number | string;  // 1/"REGISTRADO"/"APROBADO" = activo, 0/"ANULADO" = anulado
  productos: KardexTransaccionProducto[];
}

/** GET /kardex/detalleKA — acumulado de movimientos previos al rango filtrado. */
export interface KardexPrevio {
  numero: number;
  entra: number;
  sale: number;
}

/** GET /kardex/producto — info puntual del producto (stock actual real). */
export interface KardexProductoInfo {
  codigo: number;
  descripcion: string;
  marca: string;
  stock: number;
}

export interface KardexDetalleParams {
  fechaInicio: string;   // YYYY-MM-DD
  fechaFin: string;       // YYYY-MM-DD
  idProducto?: number;
  idAlmacen?: number;
}

// ─── Marca ──────────────────────────────────────────────────────────
export interface Marca {
  id: number;
  nom_marca: string;
}

// ─── Categoría ─────────────────────────────────────────────────────
export interface Categoria {
  id: number;
  categoria: string;
}

// ─── Subcategoría ──────────────────────────────────────────────────
export interface Subcategoria {
  id: number;
  sub_categoria: string;
}

// ─── Almacén ───────────────────────────────────────────────────────
export interface Almacen {
  id: number;
  nom_almacen: string;
}

// ─── Filtros del catálogo de inventario ───────────────────────────
export interface InventarioFiltros {
  descripcion?: string;
  almacen?: string;
  idProducto?: string;
  marca?: string;
  cat?: string;
  subcat?: string;
  stock?: "" | "con_stock" | "sin_stock";
}

// ─── Producto con stock bajo ────────────────────────────────────────
export interface ProductoStockMinimo {
  codigo: number;
  descripcion: string;
  marca: string;
  stock: number;
}

// ─── Lote de inventario (solicitud → verificación → aprobación) ────
/** `estado`: 0 = pendiente de verificar, 1 = verificado (pendiente aprobar), 2 = aprobado. */
export interface Lote {
  id_lote: number;
  descripcion: string;
  estado: 0 | 1 | 2;
  id_usuario_crea: number;
  creador?: string;
  id_usuario_verifica?: number | null;
  verificador?: string | null;
  fecha_verificacion?: string | null;
  id_usuario_aprueba?: number | null;
  aprobador?: string | null;
  fecha_aprobacion?: string | null;
  fecha_creacion: string;
  id_tenant?: number;
}

/**
 * Detalle de un lote: una línea por producto (sin variantes).
 * El backend puede seguir exponiendo campos de SKU para diagnóstico; el cliente los
 * ignora para mantener la UI enfocada en producto + cantidad.
 */
export interface LoteDetalle {
  id_producto: number;
  cantidad: number;
  producto: string;
  marca: string;
}

/** Item enviado al crear un lote — solo producto y cantidad (sin variantes). */
export interface LoteItemInput {
  id_producto: number;
  cantidad: number;
}

export interface LoteCreatePayload {
  descripcion: string;
  id_usuario: number;
  productos: LoteItemInput[];
}

/** Roles habilitados por etapa — GET/POST /config-verification. */
export interface VerificationConfig {
  verify: number[];
  approve: number[];
}
