export type TipoCliente = "natural" | "juridico";

/** Cliente tal como lo devuelve el backend (GET /clientes). */
export interface Cliente {
  id: number;
  nombres?: string;
  apellidos?: string;
  razon_social?: string;
  dni?: string;
  ruc?: string;
  /** El backend a veces envía el documento ya combinado. */
  dniRuc?: string;
  direccion?: string;
  estado: number; // 1 = activo, 0 = inactivo
  /** Límite de crédito; null/undefined = sin límite configurado (no bloquea ventas a crédito). */
  limite_credito?: number | string | null;
}

/** Payload para crear/actualizar (POST /clientes, PUT /clientes/updateCliente). */
export interface ClienteInput {
  id_cliente?: number;
  dni?: string;
  ruc?: string;
  nombres?: string;
  apellidos?: string;
  razon_social?: string;
  direccion?: string;
  estado?: number;
  limite_credito?: number | null;
}

/** Helpers de presentación (no dependen del backend). */
export const clienteTipo = (c: Cliente): TipoCliente =>
  c.ruc || c.razon_social ? "juridico" : "natural";

export const clienteNombre = (c: Cliente): string =>
  c.razon_social?.trim() ||
  `${c.nombres ?? ""} ${c.apellidos ?? ""}`.trim() ||
  "Sin nombre";

export const clienteDocumento = (c: Cliente): string =>
  c.dniRuc || c.ruc || c.dni || "Sin documento";

/** Una compra del cliente — GET /clientes/compras?id_cliente=. */
export interface CompraCliente {
  id: number;
  fecha: string;
  total: number | string;
  items: number;
}

/** Entrada de auditoría del cliente — GET /clientes/historial?id_cliente=. */
export interface HistorialCliente {
  id_log: number;
  accion: string;
  fecha: string;
  descripcion?: string;
  usuario?: string;
}

/** Cuenta por cobrar (venta a crédito pendiente) — GET /clientes/cuentas-por-cobrar. */
export interface CuentaPorCobrar {
  id: number;
  monto_total: number | string;
  saldo: number | string;
  fecha_vencimiento: string;
  estado: "pendiente" | "pagada_parcial" | "pagada" | string;
  id_venta: number;
  cliente: string;
}

export interface RegistrarCobroInput {
  monto: number;
  fecha: string;
  medio_pago: string;
  referencia?: string;
}
