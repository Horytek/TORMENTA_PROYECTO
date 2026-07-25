// ─────────────────────────────────────────────────────────────────
// Tipos — Devoluciones retail
// ⚠️ El backend aún NO expone /api/devoluciones: este archivo define el
// contrato que el frontend consume y que el backend debe implementar
// (ver features/returns/api/devoluciones.ts para el mapa de endpoints).
// ─────────────────────────────────────────────────────────────────

export type DevolucionEstado =
  | "borrador"
  | "pendiente_revision"
  | "pendiente_aprobacion"
  | "aprobada"
  | "rechazada"
  | "procesando_reembolso"
  | "completada"
  | "cancelada"
  | "cerrada";

export type MotivoDevolucion =
  | "producto_defectuoso"
  | "talla_incorrecta"
  | "color_incorrecto"
  | "producto_equivocado"
  | "dano_transporte"
  | "insatisfaccion"
  | "error_despacho"
  | "producto_incompleto"
  | "otro";

export type CondicionProducto = "nuevo" | "abierto" | "usado" | "danado" | "incompleto";

export type DestinoInventario =
  | "stock_disponible"
  | "revision"
  | "danados"
  | "cuarentena"
  | "reparacion"
  | "merma"
  | "devolucion_proveedor"
  | "baja_definitiva";

export type TipoResolucion =
  | "reembolso_original"
  | "reembolso_efectivo"
  | "nota_credito"
  | "saldo_favor"
  | "cambio_producto"
  | "reposicion"
  | "reembolso_parcial"
  | "rechazo";

export type CanalVenta = "tienda" | "ecommerce" | "movil" | "delivery" | "otro";

// ── Producto nuevo en un cambio ─────────────────────────────────
export interface ProductoCambio {
  id_producto: number;
  descripcion: string;
  precio_unitario: number;
  cantidad: number;
}

// ── Item devuelto ───────────────────────────────────────────────
export interface DevolucionItem {
  /** id del detalle de la venta original (dv.id_detalle). */
  id_detalle: number;
  id_producto: number;
  descripcion: string;
  sku?: string;
  nom_talla?: string;
  nom_tonalidad?: string;
  lote?: string;
  serie?: string;
  cantidad_vendida: number;
  cantidad_devuelta_previa: number;
  /** Cantidad solicitada en ESTA devolución. */
  cantidad: number;
  precio_unitario: number;
  /** Descuento/promoción original prorrateado al item. */
  descuento?: number;
  importe: number;
  motivo: MotivoDevolucion;
  motivo_detalle?: string;
  condicion: CondicionProducto;
  destino: DestinoInventario;
  /** Solo cuando la resolución es "cambio_producto". */
  producto_cambio?: ProductoCambio;
}

// ── Historial de estados / auditoría ────────────────────────────
export interface HistorialEntry {
  fecha: string;
  usuario: string;
  de?: DevolucionEstado;
  a: DevolucionEstado;
  nota?: string;
}

// ── Devolución completa ─────────────────────────────────────────
export interface Devolucion {
  id_devolucion: number;
  /** Código legible, ej. "DEV-000012". */
  codigo: string;
  id_venta: number;
  num_comprobante?: string;
  tipo_comprobante?: string;
  id_cliente?: number;
  nom_cliente?: string;
  id_sucursal?: number;
  nombre_sucursal?: string;
  caja?: string;
  canal: CanalVenta;
  fecha: string;
  estado: DevolucionEstado;
  resolucion: TipoResolucion;
  items: DevolucionItem[];
  total: number;
  igv?: number;
  /** Cambio de producto: >0 el cliente paga la diferencia, <0 saldo a favor. */
  diferencia_cambio?: number;
  responsable?: string;
  aprobador?: string;
  observaciones?: string;
  /** URLs de fotos/documentos adjuntos. */
  evidencias?: string[];
  historial?: HistorialEntry[];
}

// ── Payload de creación ─────────────────────────────────────────
export type DevolucionPayload = Omit<
  Devolucion,
  "id_devolucion" | "codigo" | "historial" | "responsable"
>;

// ── Filtros de listado ──────────────────────────────────────────
export interface DevolucionFilters {
  estado?: DevolucionEstado | DevolucionEstado[];
  id_sucursal?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  q?: string;
}

// ── Política configurable ───────────────────────────────────────
export interface PoliticaDevoluciones {
  plazo_maximo_dias: number;
  requiere_comprobante: boolean;
  /** Total sobre este monto exige aprobación de supervisor. */
  monto_max_sin_aprobacion: number;
  motivos_requieren_evidencia: MotivoDevolucion[];
  productos_no_retornables: number[];
  categorias_no_retornables: string[];
  /** Condiciones físicas que permiten volver directo a stock disponible. */
  condiciones_stock_disponible: CondicionProducto[];
  canales_permitidos: CanalVenta[];
}
