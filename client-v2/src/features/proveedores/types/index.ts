export type TipoProveedor = "natural" | "juridico";

/** Proveedor (destinatario) tal como lo devuelve el backend. */
export interface Proveedor {
  id: number;
  nombres?: string;
  apellidos?: string;
  razon_social?: string;
  dni?: string;
  ruc?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  estado: number; // 1 = activo, 0 = inactivo
}

/** Payload para crear/actualizar (el backend separa natural/jurídico). */
export interface ProveedorInput {
  tipo: TipoProveedor;
  dni?: string;
  ruc?: string;
  nombres?: string;
  apellidos?: string;
  razon_social?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  estado?: number;
}

export const proveedorTipo = (p: Proveedor): TipoProveedor =>
  p.ruc || p.razon_social ? "juridico" : "natural";

export const proveedorNombre = (p: Proveedor): string =>
  p.razon_social?.trim() ||
  `${p.nombres ?? ""} ${p.apellidos ?? ""}`.trim() ||
  "Sin nombre";

export const proveedorDocumento = (p: Proveedor): string =>
  p.ruc || p.dni || "Sin documento";
