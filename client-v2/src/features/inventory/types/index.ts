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
}

// ─── Movimiento de kardex ──────────────────────────────────────────
export interface KardexMovimiento {
  id_kardex: number;
  tipo_movimiento: string;       // "INGRESO" | "SALIDA" | "AJUSTE"
  tipo_doc: string;              // "BOLETA" | "FACTURA" | "NOTA DE SALIDA" | "NOTA DE INGRESO" | "GUÍA" | "OTRO"
  num_serie: string | null;
  num_doc: string | null;
  fecha_mov: string;
  cantidad: number;
  stock_anterior: number;
  stock_actual: number;
  id_almacen: number | null;
  nom_almacen: string | null;
  precio_unitario: number;
  total: number;
  nom_usuario: string;
}

// ─── Detalle kardex (movimientos por producto + rango fechas) ─────
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
