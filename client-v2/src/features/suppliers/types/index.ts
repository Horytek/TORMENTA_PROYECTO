export type TipoProveedor = "natural" | "juridico";

/** Proveedor tal como lo devuelve el backend vía /destinatario. */
export interface Proveedor {
  id: number;
  /** Alias compuesto que viene del backend: "nombres apellidos" o "razon_social" */
  destinatario?: string;
  /** Documento: dni o ruc según tipo */
  documento?: string;
  nombres?: string;
  apellidos?: string;
  razon_social?: string;
  dni?: string;
  ruc?: string;
  ubicacion?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  estado: number; // 1 = activo, 0 = inactivo
  /** Cantidad de productos asociados — viene del join con productos */
  productos_count?: number;
  /** Días de plazo de pago por defecto; null = sin configurar. */
  plazo_pago_dias?: number | null;
  /** Línea de crédito otorgada por el proveedor (S/); null = sin límite configurado. */
  linea_credito?: number | null;
}

/** Payload para crear/actualizar (POST /destinatario/natural | /destinatario/juridico). */
export interface ProveedorInput {
  tipo: TipoProveedor;
  dni?: string;
  ruc?: string;
  nombres?: string;
  apellidos?: string;
  razon_social?: string;
  /** El backend requiere ubicacion — se setea implícitamente a "proveedor" */
  ubicacion?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  estado?: number;
  plazo_pago_dias?: number | null;
  linea_credito?: number | null;
}

export const proveedorTipo = (p: Proveedor): TipoProveedor => {
  const doc = (p.ruc || p.dni || p.documento || "").trim();
  if (p.razon_social || p.ruc || doc.length === 11) return "juridico";
  return "natural";
};

export const proveedorNombre = (p: Proveedor): string =>
  p.razon_social?.trim() ||
  `${p.nombres ?? ""} ${p.apellidos ?? ""}`.trim() ||
  p.destinatario?.trim() ||
  "Sin nombre";

export const proveedorDocumento = (p: Proveedor): string =>
  p.ruc || p.dni || p.documento || "Sin documento";

export const proveedorLabel = (p: Proveedor): string =>
  `${proveedorNombre(p)} — ${proveedorDocumento(p)}`;

// Cuentas por pagar: ver `@/features/purchases/types` (AccountPayable, AccountPayablePayment,
// RegisterPaymentPayload) — se consolidó ahí para no duplicar con la página de Compras.
