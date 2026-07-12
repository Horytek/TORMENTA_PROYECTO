// ─────────────────────────────────────────────────────────────────
// Tipos — Ventas y POS
// ─────────────────────────────────────────────────────────────────

export type ComprobanteTipo = "Boleta" | "Factura" | "Nota";
export type MetodoPago = "EFECTIVO" | "TARJETA" | "TRANSFERENCIA" | "YAPE" | "PLIN" | "MIXTO";
export type VentaEstado = 1 | 0; // 1=completada, 0=anulada

// ── Item en carrito ─────────────────────────────────────────────
export interface CartItem {
  id_variante: number;
  id_producto: number;
  sku: string;
  codigo_barra?: string;
  descripcion: string;
  nom_marca?: string;
  categoria_p?: string;
  cantidad: number;
  precio_unitario: number;
  precio_total: number;
  stock?: number;
  attributes_json?: string; // ej. "Color: Rojo, Talla: M"
}

// ── Detalle de venta (respuesta API / backend) ─────────────────
export interface VentaDetalle {
  id_detalle: number;
  id_venta: number;
  id_producto: number;
  id_variante?: number;
  sku?: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  precio_total: number;
  id_tonalidad?: number;
  id_talla?: number;
  nom_tonalidad?: string;
  nom_talla?: string;
}

// ── Venta (respuesta API) ───────────────────────────────────────
export interface Venta {
  id_venta: number;
  id_sucursal: number;
  id_almacen?: number;
  id_cliente?: number;
  nom_cliente?: string;
  documento_cliente?: string;
  direccion_cliente?: string;
  id_comprobante: string; // nombre: "Boleta" | "Factura" | "Nota"
  tipo_comprobante?: number;
  num_comprobante: string; // ej. "B001-00001234"
  f_venta: string; // ISO date
  igv: number;
  igv_b: number;
  total_t: number;
  totalImporte_venta: number;
  descuento_venta: number;
  estado_venta: VentaEstado;
  metodo_pago: MetodoPago;
  formadepago?: string;
  vuelto?: number;
  recibido?: number;
  observacion?: string;
  estado_sunat?: string;
  comprobante_pago?: string;
  nombre_pdf?: string;
  id_usuario: number;
  nom_usuario?: string;
  detalles?: VentaDetalle[];
}

// ── Payload para crear venta ────────────────────────────────────
export interface VentaPayload {
  id_sucursal: number;
  id_almacen?: number;
  id_cliente?: number;
  nombre_cliente?: string;
  documento_cliente?: string;
  direccion_cliente?: string;
  id_comprobante: ComprobanteTipo;
  estado_venta?: 1;
  f_venta: string;
  fecha_iso?: string;
  metodo_pago: MetodoPago;
  formadepago?: string;
  igv: number;
  igv_b?: number;
  total_t: number;
  totalImporte_venta?: number;
  descuento_venta?: number;
  vuelto?: number;
  recibido?: number;
  observacion?: string;
  comprobante_pago?: string;
  detalles: VentaDetallePayload[];
}

export interface VentaDetallePayload {
  id_producto: number;
  id_variante?: number;
  sku?: string;
  cantidad: number;
  precio_unitario: number;
  precio_total: number;
  id_tonalidad?: number;
  id_talla?: number;
}

// ── Libro de ventas (reporte) ──────────────────────────────────
export interface VentasFilters {
  fecha_inicio?: string;
  fecha_fin?: string;
  id_sucursal?: number;
  estado?: number;
  id_comprobante?: string;
}

export interface VentasStats {
  total_ventas: number;
  cantidad_ventas: number;
  igv_total: number;
  promedio_venta: number;
}

// ── Producto en catálogo POS ────────────────────────────────────
export interface POSProduct {
  codigo: number; // id_producto
  nombre: string;
  precio: number;
  stock: number;
  undm: string;
  nom_marca?: string;
  categoria_p?: string;
  codigo_barras?: string;
}

// ── Carrito completo (para PaymentModal) ───────────────────────
export interface CartSummary {
  items: CartItem[];
  subtotal: number;
  igv: number;
  total: number;
  vuelto: number;
  cliente: ClienteForSale | null;
  comprobanteTipo: ComprobanteTipo;
  metodoPago: MetodoPago;
  montoRecibido: number;
}

// ── Helper para clientes en venta ────────────────────────────────
export interface ClienteForSale {
  id_cliente: number;
  nombres?: string;
  apellidos?: string;
  razon_social?: string;
  dni?: string;
  ruc?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
}

export function clienteNombre(c: ClienteForSale): string {
  if (c.razon_social) return c.razon_social;
  return [c.nombres, c.apellidos].filter(Boolean).join(" ") || `Cliente ${c.id_cliente}`;
}

export function clienteDocumento(c: ClienteForSale): string {
  return c.ruc || c.dni || "—";
}

// ── Respuesta creación de venta ────────────────────────────────
export interface CreateVentaResponse {
  success: boolean;
  id_venta?: number;
  num_comprobante?: string;
  message?: string;
  estado_sunat?: string;
  venta?: Venta;
}
