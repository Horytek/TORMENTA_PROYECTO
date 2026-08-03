/** Tipo de movimiento de una nota de almacén. */
export type NoteKind = "ingreso" | "salida";

/** Detalle (item) de una nota, tal como lo devuelve el backend. */
export interface WarehouseNoteDetail {
  codigo: number;
  descripcion: string;
  marca: string;
  categoria?: string;
  cantidad: number;
  unidad: string;
  precio?: number;
  total?: number;
  /** "-" cuando el producto no tiene esa variante. */
  nombre_tonalidad: string;
  nombre_talla: string;
  sku_label: string | null;
  /** JSON stringificado de atributos dinámicos, ej. '{"1":"Rojo","2":"M"}'. */
  attributes: string | null;
  id_producto?: number;
}

/**
 * Nota de almacén (cabecera) — GET /nota_ingreso y GET /nota_salida.
 * `estado`: 0 = activa, 1 = anulada (columna `estado_nota` en BD).
 */
export interface WarehouseNote {
  id: number;
  fecha: string;
  documento: string;
  /** Proveedor (ingreso) o destinatario (salida). */
  proveedor: string;
  almacen_O: string | null;
  almacen_D: string | null;
  concepto: string;
  estado: number;
  estado_espera?: number;
  usuario: string;
  observacion: string;
  hora_creacion?: string;
  fecha_anulacion?: string | null;
  u_modifica?: string | null;
  total_nota?: number;
  detalles?: WarehouseNoteDetail[];
}

export interface NotaFiltros {
  page?: number;
  limit?: number;
  fecha_i?: string;
  fecha_e?: string;
  razon_social?: string;
  almacen?: string | number;
  usuario?: string;
  documento?: string;
  estado?: string;
}

/** Almacén disponible para origen/destino de una nota. */
export interface NotaAlmacen {
  id: number;
  almacen: string;
  sucursal: string;
  usuario?: string;
}

/** Proveedor/destinatario — GET /nota_ingreso/destinatario o /nota_salida/destinatario. */
export interface Destination {
  id: number;
  documento: string;
  destinatario: string;
}

/** Correlativo de documento — GET /nota_ingreso/ndocumento o /nota_salida/nuevodocumento. */
export interface DocumentType {
  nuevo_numero_de_nota: string;
}

/** Producto disponible para agregar a una nota — GET /nota_ingreso|salida/productos. */
export interface NotaProducto {
  codigo: number;
  descripcion: string;
  marca: string;
  stock?: number;
  cod_barras?: string;
}

/** Item agregado a una nota en edición (estado local del formulario). */
export interface NoteFormItem {
  uniqueKey: string;
  codigo: number;
  descripcion: string;
  marca: string;
  stock?: number;
  cantidad: number;
  id_tonalidad: number | null;
  id_talla: number | null;
  id_sku: number | null;
  nombre_tonalidad: string | null;
  nombre_talla: string | null;
  sku_label: string | null;
  /** Costo unitario de esta línea (solo aplica a ingresos reales, no traslados). null = no ingresado. */
  costo: number | null;
}

/** Payload esperado por POST /nota_ingreso/addNota y POST /nota_salida/nuevanota. */
export interface NotaInsertPayload {
  almacenO?: number | string | null;
  almacenD?: number | string | null;
  destinatario: number | string;
  glosa: string;
  nota: string;
  fecha: string;
  observacion?: string;
  producto: number[];
  cantidad: number[];
  tonalidad: (number | null)[];
  talla: (number | null)[];
  sku: (number | null)[];
  numComprobante: string;
  /** Ingreso identifica al usuario con `usuario`; salida con `nom_usuario`. */
  usuario?: string;
  nom_usuario?: string;
  /** Costo unitario por línea, paralelo a `producto`. Solo se manda en ingresos reales (sin almacenO). */
  costos?: number[];
  /** Solo se respeta si la empresa es MIXTO; ver services/costos/origenCosto.js. */
  origen_costo?: string | null;
}

export interface NotaInsertResult {
  success: boolean;
  message?: string;
}

/** Payload de POST /transferencia_almacen — salida + ingreso en una sola transacción. */
export interface TransferenciaInsertPayload {
  almacenO: number | string;
  almacenD: number | string;
  destinatario: number | string;
  glosa: string;
  nota: string;
  fecha: string;
  observacion?: string;
  producto: number[];
  cantidad: number[];
  tonalidad: (number | null)[];
  talla: (number | null)[];
  sku: (number | null)[];
  numComprobanteSalida: string;
  numComprobanteIngreso: string;
  usuario: string;
}
