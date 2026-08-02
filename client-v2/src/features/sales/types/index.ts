// ─────────────────────────────────────────────────────────────────
// Tipos — Ventas y POS
// Adaptado al backend real: campos de GET /api/ventas (ventas.controller.js getVentas)
// ─────────────────────────────────────────────────────────────────

export type ComprobanteTipo = "Boleta" | "Factura" | "Nota de venta";
export type MetodoPago = "EFECTIVO" | "TARJETA" | "TRANSFERENCIA" | "YAPE" | "PLIN" | "MIXTO" | "CREDITO";
export type VentaEstado = 1 | 0;

// ── Item en carrito ─────────────────────────────────────────────
// Clave única del item: (id_producto, id_sku ?? null). Un producto sin
// variantes generadas siempre tiene id_sku=null, así que su clave sigue
// siendo estable y el flujo de hoy no cambia.
export interface CartItem {
  id_producto: number;
  codigo_barra?: string;
  descripcion: string;
  nom_marca?: string;
  categoria_p?: string;
  cantidad: number;
  precio_unitario: number;
  precio_total: number;
  stock?: number;
  id_tonalidad?: number;
  id_talla?: number;
  /** Variante elegida (motor genérico atributo/producto_sku); null = sin variante. */
  id_sku?: number | null;
  sku_label?: string | null;
  /**
   * Fase B — variante colapsada: el cajero fijó solo ALGUNOS atributos (ej.
   * talla=M, "cualquier color") en vez de un SKU exacto. { id_atributo → valor }.
   * Mutuamente excluyente con `id_sku`: si viene esto, `id_sku` queda null y el
   * backend reparte el stock entre los SKU reales que matchean (ver
   * `descontarPorProducto` en stockRepository.js).
   */
  atributos_fijados?: Record<string, string> | null;
  /** Descuento en monto (no %) aplicado a esta línea; se descuenta de precio_total. */
  descuento?: number;
  /** Catálogo 07 SUNAT del producto: "10"=Gravado (default), "20"=Exonerado, "30"=Inafecto. */
  tipo_afectacion_igv?: string;
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
  nombre_producto?: string;
  nombre?: string;
}

// ── Venta (respuesta GET /api/ventas — nombres reales del backend) ───────────
export interface Venta {
  // ── campos del backend getVentas ────────────────────────
  id?: number;                  // alias: id_venta (viene como 'id')
  serieNum?: string;            // serie del comprobante p.ej. "B001"
  num?: string;                 // número correlativo p.ej. "00001234"
  tipoComprobante?: string;     // "Boleta" | "Factura" | "Nota"
  cliente_n?: string;           // nombre del cliente
  cliente_r?: string;           // razón social del cliente
  dni?: string;
  ruc?: string;
  fecha?: string;               // YYYY-MM-DD
  igv?: number;
  total?: number;               // SUM(dv.total)
  cajero?: string;              // nombre del cajero
  cajeroId?: string;            // DNI del cajero
  estado?: number;              // 1=completada, 0=anulada
  nombre_sucursal?: string;
  id_sucursal?: number;
  ubicacion?: string;
  direccion?: string;
  fecha_iso?: string;
  metodo_pago?: string;
  recibido?: number;
  vuelto?: number;
  descuento?: number;
  estado_sunat?: string;
  usua?: string;
  observacion?: string;
  hora_creacion?: string;
  fecha_anulacion?: string;
  u_modifica?: string;
  detalles?: VentaDetalle[];

  // ── aliases convenientes (para compatibilidad) ──────────
  /** alias de `id` */
  id_venta?: number;
  /** alias: tipoComprobante */
  id_comprobante?: string;
  /** alias: fecha */
  f_venta?: string;
  /** nombre del cliente (cli_n o cli_r) */
  nom_cliente?: string;
  /** documento del cliente (dni o ruc) */
  documento_cliente?: string;
  /** alias de total */
  total_t?: number;
  /** alias de estado */
  estado_venta?: VentaEstado;
  /** serie + num */
  num_comprobante?: string;
  /** alias de usua */
  nom_usuario?: string;
  /** dirección del cliente */
  direccion_cliente?: string;
  /** descuento */
  descuento_venta?: number;
}

// ── Payload para crear venta ────────────────────────────────────
export interface VentaPayload {
  idempotency_key?: string;
  id_sucursal?: number;
  id_almacen?: number;
  id_cliente?: number | null;
  nombre_cliente?: string;
  documento_cliente?: string;
  direccion_cliente?: string;
  id_comprobante: ComprobanteTipo;
  estado_venta?: 1;
  f_venta: string;
  fecha_iso?: string;
  // string codificado: "EFECTIVO:50,YAPE:30" o "EFECTIVO" para notas
  metodo_pago: string;
  formadepago?: string;
  igv: number;
  igv_b?: number;
  total_t: number;
  totalImporte_venta?: number;
  descuento_venta?: number;
  /** Obligatorio cuando descuento_venta > 0 — el backend lo rechaza si falta. */
  motivo_descuento?: string;
  /** N° de operación por método de pago digital, ej. { YAPE: "123456" }. Solo los que se capturaron. */
  referencia_pago?: Record<string, string>;
  /** Puntos del Club de Fidelización canjeados en esta venta (ya restados de descuento_venta en el frontend). */
  dni_vendedor?: string;
  puntos_canjeados?: number;
  vuelto?: number;
  recibido?: number;
  observacion?: string;
  comprobante_pago?: string;
  detalles: VentaDetallePayload[];
}

export interface VentaDetallePayload {
  id_producto: number;
  cantidad: number;
  precio_unitario: number;
  precio_total: number;
  id_tonalidad?: number;
  id_talla?: number;
  id_sku?: number | null;
  /** Ver `CartItem.atributos_fijados`. */
  atributos_fijados?: Record<string, string> | null;
  descuento?: number;
}

// ── Libro de ventas (reporte) ──────────────────────────────────
export interface VentasFilters {
  fecha_inicio?: string;
  fecha_fin?: string;
  id_sucursal?: number;
  estado?: number;
  id_comprobante?: string;
  dni_vendedor?: string;
}

export interface VentasStats {
  total_ventas: number;
  cantidad_ventas: number;
  igv_total: number;
  promedio_venta: number;
}

// ── Producto en catálogo POS ────────────────────────────────────
export interface POSProduct {
  codigo: number;
  nombre: string;
  precio: number;
  stock: number;
  undm: string;
  nom_marca?: string;
  categoria_p?: string;
  codigo_barras?: string;
  /** true = tiene variantes generadas; el POS debe pedir cuál antes de agregar. */
  tiene_variantes?: boolean;
  /** Punto de reorden configurado en Productos; null/undefined = sin umbral configurado. */
  stock_min?: number | null;
  /** Catálogo 07 SUNAT: "10"=Gravado (default), "20"=Exonerado, "30"=Inafecto. */
  tipo_afectacion_igv?: string;
  /** Combo/kit: `stock` ya viene calculado como "combos armables" según sus componentes. */
  es_combo?: boolean;
}

// ── Carrito completo ────────────────────────────────────────────
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
  /** Límite de crédito configurado; null/undefined = sin límite (no bloquea ventas a crédito). */
  limite_credito?: number | string | null;
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

// ── Mapeo de campos del backend ──────────────────────────────────
// El backend GET /api/ventas devuelve nombres distintos a los types.
// Se aplica este mapping para normalizar antes de usar en el frontend.
export function mapBackendVenta(raw: Record<string, unknown>): Venta {
  const serieNum = String(raw.serieNum ?? "");
  const num = String(raw.num ?? "");
  const serie = serieNum.replace(/\D/g, "");
  const correlativo = num.padStart(8, "0");
  const nomCliente = (raw.cliente_n as string | undefined)?.trim()
    || (raw.cliente_r as string | undefined)?.trim()
    || undefined;
  const docCliente = (raw.dni as string | undefined)?.trim()
    || (raw.ruc as string | undefined)?.trim()
    || undefined;

  return {
    ...(raw as unknown as Venta),
    // aliases convenientes
    id_venta: (raw.id as number) ?? raw.id_venta as number,
    id_comprobante: raw.tipoComprobante as string,
    f_venta: raw.fecha as string,
    nom_cliente: nomCliente,
    documento_cliente: docCliente,
    total_t: raw.total as number,
    estado_venta: raw.estado as VentaEstado,
    num_comprobante: serie && num ? `${serie}-${correlativo}` : (raw.num_comprobante as string),
    nom_usuario: raw.usua as string ?? raw.cajero as string,
    direccion_cliente: (raw.direccion as string) || (raw.ubicacion as string),
    descuento_venta: raw.descuento as number,
  };
}
