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
