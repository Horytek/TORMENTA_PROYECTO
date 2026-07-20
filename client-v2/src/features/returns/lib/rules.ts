// ─────────────────────────────────────────────────────────────────
// Reglas de negocio de devoluciones — funciones puras, sin React.
// Todo lo testeable del módulo vive acá (ver rules.test.ts).
// ─────────────────────────────────────────────────────────────────
import type {
  CondicionProducto,
  DestinoInventario,
  Devolucion,
  DevolucionEstado,
  DevolucionItem,
  MotivoDevolucion,
  PoliticaDevoluciones,
} from "../types";

// ── Cantidades ──────────────────────────────────────────────────

/** Cuánto queda por devolver de un detalle (vendida − devuelta previamente). */
export function cantidadDisponible(i: {
  cantidad_vendida: number;
  cantidad_devuelta_previa: number;
}): number {
  return Math.max(0, i.cantidad_vendida - i.cantidad_devuelta_previa);
}

/** Suma lo ya devuelto de un detalle a través de devoluciones anteriores no rechazadas/canceladas. */
export function devueltoPrevio(idDetalle: number, previas: Devolucion[]): number {
  const NO_CUENTAN: DevolucionEstado[] = ["rechazada", "cancelada", "borrador"];
  return previas
    .filter((d) => !NO_CUENTAN.includes(d.estado))
    .flatMap((d) => d.items)
    .filter((i) => i.id_detalle === idDetalle)
    .reduce((acc, i) => acc + i.cantidad, 0);
}

// ── Importes ────────────────────────────────────────────────────

export function importeItem(cantidad: number, precioUnitario: number, descuento = 0): number {
  return Math.max(0, cantidad * precioUnitario - descuento);
}

export function totalDevolucion(items: Pick<DevolucionItem, "importe">[]): number {
  return items.reduce((acc, i) => acc + i.importe, 0);
}

/**
 * Diferencia económica de un cambio de producto sobre todos los items:
 * >0 → el cliente paga la diferencia; <0 → saldo a favor del cliente.
 */
export function diferenciaCambio(items: DevolucionItem[]): number {
  return items.reduce((acc, i) => {
    if (!i.producto_cambio) return acc;
    const nuevo = i.producto_cambio.precio_unitario * i.producto_cambio.cantidad;
    return acc + (nuevo - i.importe);
  }, 0);
}

// ── Máquina de estados ──────────────────────────────────────────

export const TRANSICIONES: Record<DevolucionEstado, DevolucionEstado[]> = {
  borrador: ["pendiente_revision", "pendiente_aprobacion", "cancelada"],
  pendiente_revision: ["pendiente_aprobacion", "aprobada", "rechazada", "cancelada"],
  pendiente_aprobacion: ["aprobada", "rechazada", "cancelada"],
  aprobada: ["procesando_reembolso", "completada", "cancelada"],
  procesando_reembolso: ["completada", "cancelada"],
  rechazada: [],
  completada: ["cerrada"],
  cancelada: [],
  cerrada: [],
};

export function puedeTransicionar(de: DevolucionEstado, a: DevolucionEstado): boolean {
  return TRANSICIONES[de]?.includes(a) ?? false;
}

// ── Política ────────────────────────────────────────────────────

export function diasDesde(fechaVenta: string, hoy: Date = new Date()): number {
  const venta = new Date(fechaVenta);
  if (isNaN(venta.getTime())) return Infinity;
  return Math.floor((hoy.getTime() - venta.getTime()) / 86_400_000);
}

export interface EvaluacionPolitica {
  permitida: boolean;
  errores: string[];
  advertencias: string[];
  requiere_aprobacion: boolean;
  requiere_evidencia: boolean;
}

/** Evalúa la política sobre una devolución en curso. */
export function evaluarDevolucion(params: {
  fecha_venta: string;
  items: DevolucionItem[];
  politica: PoliticaDevoluciones;
  canal?: string;
  hoy?: Date;
}): EvaluacionPolitica {
  const { fecha_venta, items, politica, canal, hoy } = params;
  const errores: string[] = [];
  const advertencias: string[] = [];

  const dias = diasDesde(fecha_venta, hoy);
  if (dias > politica.plazo_maximo_dias) {
    errores.push(
      `La venta tiene ${dias} días; el plazo máximo para devolver es ${politica.plazo_maximo_dias} días.`
    );
  }

  if (canal && !politica.canales_permitidos.includes(canal as never)) {
    errores.push(`El canal "${canal}" no admite devoluciones según la política vigente.`);
  }

  if (items.length === 0) {
    errores.push("Selecciona al menos un producto a devolver.");
  }

  for (const item of items) {
    if (politica.productos_no_retornables.includes(item.id_producto)) {
      errores.push(`"${item.descripcion}" está marcado como no retornable.`);
    }
    if (item.cantidad <= 0) {
      errores.push(`"${item.descripcion}": la cantidad debe ser mayor a cero.`);
    }
    if (item.cantidad > cantidadDisponible(item)) {
      errores.push(
        `"${item.descripcion}": solo quedan ${cantidadDisponible(item)} unidades por devolver.`
      );
    }
    if (item.condicion !== "nuevo" && item.destino === "stock_disponible") {
      advertencias.push(
        `"${item.descripcion}" no está en condición nueva pero volvería a stock disponible.`
      );
    }
  }

  const total = totalDevolucion(items);
  const requiere_aprobacion = total > politica.monto_max_sin_aprobacion;
  if (requiere_aprobacion) {
    advertencias.push(
      `El importe (S/ ${total.toFixed(2)}) supera el límite sin aprobación (S/ ${politica.monto_max_sin_aprobacion.toFixed(2)}): requerirá autorización de un supervisor.`
    );
  }

  const requiere_evidencia = items.some((i) =>
    politica.motivos_requieren_evidencia.includes(i.motivo)
  );

  return { permitida: errores.length === 0, errores, advertencias, requiere_aprobacion, requiere_evidencia };
}

/** Destino de inventario sugerido según la condición física del producto. */
export function destinoSugerido(
  condicion: CondicionProducto,
  politica: PoliticaDevoluciones
): DestinoInventario {
  if (politica.condiciones_stock_disponible.includes(condicion)) return "stock_disponible";
  switch (condicion) {
    case "danado":
      return "danados";
    case "incompleto":
      return "revision";
    default:
      return "revision";
  }
}

/** Estado inicial al confirmar el wizard, según la evaluación de política. */
export function estadoInicial(ev: EvaluacionPolitica): DevolucionEstado {
  return ev.requiere_aprobacion ? "pendiente_aprobacion" : "pendiente_revision";
}

/** Motivos que por defecto exigen evidencia fotográfica. */
export const MOTIVOS_CON_EVIDENCIA: MotivoDevolucion[] = [
  "producto_defectuoso",
  "dano_transporte",
  "producto_incompleto",
];
