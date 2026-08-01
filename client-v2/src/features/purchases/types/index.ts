export type EstadoOrdenCompra = "draft" | "approved" | "partially_received" | "received" | "cancelled";
export type EstadoFactura = "pendiente" | "pagada" | "anulada";
export type EstadoCuentaPorPagar = "pendiente" | "pagada_parcial" | "pagada" | "vencida";

export interface PurchaseOrder {
  id: number;
  fecha: string;
  estado: EstadoOrdenCompra;
  glosa: string | null;
  observacion: string | null;
  proveedor: string;
  id_destinatario: number;
  almacen: string;
  id_almacen: number;
  monto_total: number | null;
}

export interface PurchaseOrderItem {
  id_detalle_orden_compra: number;
  id_producto: number;
  descripcion: string;
  marca: string;
  cantidad: number;
  cantidad_recibida: number;
  precio_unitario: number;
  total: number;
  nombre_tonalidad: string | null;
  nombre_talla: string | null;
  sku_label: string | null;
}

export interface PurchaseOrderDetail extends PurchaseOrder {
  fecha_creacion: string;
  id_nota_recepcion: number | null;
  items: PurchaseOrderItem[];
}

/** Línea en edición dentro del formulario de creación (aún no enviada). */
export interface PurchaseOrderFormItem {
  uniqueKey: string;
  id_producto: number;
  descripcion: string;
  marca: string;
  cantidad: number;
  precio_unitario: number;
  id_tonalidad: number | null;
  id_talla: number | null;
  id_sku: number | null;
}

export interface PurchaseOrderInsertPayload {
  id_destinatario: number | string;
  id_almacen: number | string;
  fecha: string;
  glosa?: string;
  observacion?: string;
  items: {
    id_producto: number;
    id_tonalidad: number | null;
    id_talla: number | null;
    id_sku: number | null;
    cantidad: number;
    precio_unitario: number;
  }[];
}

export interface PurchaseInvoice {
  id: number;
  num_factura: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  monto_total: number;
  estado: EstadoFactura;
  id_orden_compra: number | null;
  proveedor: string;
  id_destinatario: number;
}

export interface PurchaseInvoiceInsertPayload {
  id_orden_compra?: number | null;
  id_destinatario: number | string;
  num_factura: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  monto_total: number;
}

export interface AccountPayable {
  id: number;
  monto_total: number;
  saldo: number;
  fecha_vencimiento: string;
  estado: EstadoCuentaPorPagar;
  num_factura: string;
  id_factura_compra: number;
  proveedor: string;
}

export interface AccountPayablePayment {
  id_pago: number;
  monto: number;
  fecha: string;
  medio_pago: string;
  referencia: string | null;
}

export interface RegisterPaymentPayload {
  monto: number;
  fecha: string;
  medio_pago: string;
  referencia?: string;
}

export type EstadoAnticipo = "disponible" | "aplicado" | "anulado";

/** Dinero entregado a un proveedor antes de que exista una factura de compra. */
export interface SupplierAdvance {
  id: number;
  monto: number;
  saldo_disponible: number;
  fecha: string;
  medio_pago: string;
  referencia: string | null;
  estado: EstadoAnticipo;
  id_destinatario: number;
  proveedor: string;
}

export interface SupplierAdvanceInsertPayload {
  id_destinatario: number | string;
  monto: number;
  fecha: string;
  medio_pago: string;
  referencia?: string;
}

export interface ApplyAdvancePayload {
  id_cuenta_por_pagar: number;
  monto: number;
}
