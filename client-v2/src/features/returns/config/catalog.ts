// ─────────────────────────────────────────────────────────────────
// Catálogo visual del módulo de devoluciones: etiquetas en español,
// estado semántico para AdaptiveCollection y política por defecto.
// La política es configurable: cuando exista el endpoint de configuración
// del negocio, se hidrata desde ahí y este objeto queda como fallback.
// ─────────────────────────────────────────────────────────────────
import type { ItemState } from "@/components/shared/AdaptiveCollection";
import type {
  CanalVenta,
  CondicionProducto,
  DestinoInventario,
  DevolucionEstado,
  MotivoDevolucion,
  PoliticaDevoluciones,
  TipoResolucion,
} from "../types";
import { MOTIVOS_CON_EVIDENCIA } from "../lib/rules";

export const ESTADO_META: Record<DevolucionEstado, { label: string; state: ItemState }> = {
  borrador: { label: "Borrador", state: "neutral" },
  pendiente_revision: { label: "Pendiente de revisión", state: "warning" },
  pendiente_aprobacion: { label: "Pendiente de aprobación", state: "warning" },
  aprobada: { label: "Aprobada", state: "info" },
  rechazada: { label: "Rechazada", state: "error" },
  procesando_reembolso: { label: "Procesando reembolso", state: "info" },
  completada: { label: "Completada", state: "active" },
  cancelada: { label: "Cancelada", state: "inactive" },
  cerrada: { label: "Cerrada", state: "inactive" },
};

export const MOTIVO_LABELS: Record<MotivoDevolucion, string> = {
  producto_defectuoso: "Producto defectuoso",
  talla_incorrecta: "Talla incorrecta",
  color_incorrecto: "Color incorrecto",
  producto_equivocado: "Producto equivocado",
  dano_transporte: "Daño durante el transporte",
  insatisfaccion: "Insatisfacción del cliente",
  error_despacho: "Error de despacho",
  producto_incompleto: "Producto incompleto",
  otro: "Otro motivo",
};

export const CONDICION_LABELS: Record<CondicionProducto, string> = {
  nuevo: "Nuevo / sin abrir",
  abierto: "Abierto",
  usado: "Usado",
  danado: "Dañado",
  incompleto: "Incompleto",
};

export const DESTINO_LABELS: Record<DestinoInventario, string> = {
  stock_disponible: "Stock disponible",
  revision: "Stock en revisión",
  danados: "Productos dañados",
  cuarentena: "Cuarentena",
  reparacion: "Reparación",
  merma: "Merma",
  devolucion_proveedor: "Devolución al proveedor",
  baja_definitiva: "Baja definitiva",
};

export const RESOLUCION_LABELS: Record<TipoResolucion, string> = {
  reembolso_original: "Reembolso al método de pago original",
  reembolso_efectivo: "Reembolso en efectivo",
  nota_credito: "Nota de crédito",
  saldo_favor: "Saldo a favor del cliente",
  cambio_producto: "Cambio por otro producto",
  reposicion: "Reposición del mismo producto",
  reembolso_parcial: "Devolución parcial del importe",
  rechazo: "Rechazo justificado",
};

export const CANAL_LABELS: Record<CanalVenta, string> = {
  tienda: "Tienda física",
  ecommerce: "eCommerce",
  movil: "Venta móvil",
  delivery: "Despacho a domicilio",
  otro: "Otro canal",
};

export const POLITICA_DEFAULT: PoliticaDevoluciones = {
  plazo_maximo_dias: 30,
  requiere_comprobante: true,
  monto_max_sin_aprobacion: 200,
  motivos_requieren_evidencia: MOTIVOS_CON_EVIDENCIA,
  productos_no_retornables: [],
  categorias_no_retornables: [],
  condiciones_stock_disponible: ["nuevo"],
  canales_permitidos: ["tienda", "ecommerce", "movil", "delivery"],
};

/** Formato de moneda usado en todo el módulo (mismo patrón que el POS). */
export const soles = (n: number | undefined | null) => `S/ ${(Number(n) || 0).toFixed(2)}`;
