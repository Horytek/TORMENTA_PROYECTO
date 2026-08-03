export type TransferState = "SOLICITADA" | "DESPACHADA" | "RECIBIDA" | "CANCELADA";

export interface TransferDetail {
  id_detalle: number;
  id_transferencia: number;
  id_sku: number;
  sku: string;
  nom_producto: string;
  attributes_json?: string;
  cantidad_solicitada: number;
  cantidad_despachada: number;
  cantidad_recibida: number;
  observacion_item?: string;
}

export interface GuidedTransfer {
  id_transferencia: number;
  id_tenant: number;
  id_almacen_origen: number;
  id_almacen_destino: number;
  almacen_origen?: string;
  almacen_destino?: string;
  codigo_transferencia: string;
  estado: TransferState;
  glosa?: string;
  id_usuario_solicita: number;
  id_usuario_despacha?: number;
  id_usuario_recibe?: number;
  f_solicitud: string;
  f_despacho?: string;
  f_recepcion?: string;
  observaciones?: string;
  detalles?: TransferDetail[];
}

export type BlindCountState = "EN_PROCESO" | "CONTEO_COMPLETADO" | "APLICADO" | "CANCELADO";

export interface BlindCountSession {
  id_inventario_fisico: number;
  id_tenant: number;
  id_almacen: number;
  nom_almacen?: string;
  codigo_conteo: string;
  titulo: string;
  estado: BlindCountState;
  id_usuario_crea: number;
  id_usuario_aplica?: number;
  f_creacion: string;
  f_aplicacion?: string;
  observaciones?: string;
}

export interface ReconciliationItem {
  id_detalle: number;
  id_inventario_fisico: number;
  id_sku: number;
  sku: string;
  nom_producto: string;
  attributes_json?: string;
  cod_barras?: string;
  stock_sistema_snapshot: number;
  cantidad_contada?: number;
  diferencia?: number;
  costo_unitario_snapshot: number;
  valor_diferencia: number;
  observacion_item?: string;
}

export interface ReconciliationMatrixData {
  inventario: BlindCountSession;
  detalles: ReconciliationItem[];
  resumen: {
    total_items: number;
    sobrantes_count: number;
    faltantes_count: number;
    coincidentes_count: number;
    valor_total_diferencia: number;
  };
}
