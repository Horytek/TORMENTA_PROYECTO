/**
 * Reglas de negocio de devoluciones — puerto a servidor de
 * client-v2/src/features/returns/lib/rules.ts.
 *
 * El frontend ya valida esto mismo, pero el servidor no puede confiar en un
 * payload de cliente para decidir cuánto stock reingresa o qué estado inicial
 * le toca a una devolución (Regla de Oro Nº1/Nº2 de CLAUDE.md): estas mismas
 * funciones corren aquí para que el rechazo sea idéntico en ambos lados.
 */

export const MOTIVOS_CON_EVIDENCIA = ["producto_defectuoso", "dano_transporte", "producto_incompleto"];

export const POLITICA_DEFAULT = {
  plazo_maximo_dias: 30,
  monto_max_sin_aprobacion: 200,
  motivos_requieren_evidencia: MOTIVOS_CON_EVIDENCIA,
  productos_no_retornables: [],
  condiciones_stock_disponible: ["nuevo"],
  canales_permitidos: ["tienda", "ecommerce", "movil", "delivery", "otro"],
};

export const TRANSICIONES = {
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

export function puedeTransicionar(de, a) {
  return TRANSICIONES[de]?.includes(a) ?? false;
}

/** Cuánto queda por devolver de un detalle (vendida − devuelta previamente). */
export function cantidadDisponible({ cantidad_vendida, cantidad_devuelta_previa }) {
  return Math.max(0, cantidad_vendida - cantidad_devuelta_previa);
}

/** Suma lo ya devuelto de un detalle en devoluciones previas no rechazadas/canceladas/borrador. */
export function devueltoPrevio(idDetalle, previas) {
  const NO_CUENTAN = ["rechazada", "cancelada", "borrador"];
  return previas
    .filter((d) => !NO_CUENTAN.includes(d.estado))
    .flatMap((d) => d.items)
    .filter((i) => i.id_detalle === idDetalle)
    .reduce((acc, i) => acc + Number(i.cantidad), 0);
}

export function importeItem(cantidad, precioUnitario, descuento = 0) {
  return Math.max(0, Math.round((cantidad * precioUnitario - descuento) * 100) / 100);
}

export function totalDevolucion(items) {
  return Math.round(items.reduce((acc, i) => acc + Number(i.importe), 0) * 100) / 100;
}

/** >0 el cliente paga la diferencia; <0 saldo a favor. Solo aplica a items con producto_cambio. */
export function diferenciaCambio(items) {
  const total = items.reduce((acc, i) => {
    if (!i.producto_cambio) return acc;
    const nuevo = i.producto_cambio.precio_unitario * i.producto_cambio.cantidad;
    return acc + (nuevo - i.importe);
  }, 0);
  return Math.round(total * 100) / 100;
}

export function diasDesde(fechaVenta, hoy = new Date()) {
  const venta = new Date(fechaVenta);
  if (isNaN(venta.getTime())) return Infinity;
  return Math.floor((hoy.getTime() - venta.getTime()) / 86_400_000);
}

/** Evalúa la política sobre una devolución en curso. Misma forma que el frontend (rules.ts). */
export function evaluarDevolucion({ fecha_venta, items, politica = POLITICA_DEFAULT, canal, hoy }) {
  const errores = [];
  const advertencias = [];

  const dias = diasDesde(fecha_venta, hoy);
  if (dias > politica.plazo_maximo_dias) {
    errores.push(`La venta tiene ${dias} días; el plazo máximo para devolver es ${politica.plazo_maximo_dias} días.`);
  }

  if (canal && !politica.canales_permitidos.includes(canal)) {
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
      errores.push(`"${item.descripcion}": solo quedan ${cantidadDisponible(item)} unidades por devolver.`);
    }
  }

  const total = totalDevolucion(items);
  const requiere_aprobacion = total > politica.monto_max_sin_aprobacion;
  const requiere_evidencia = items.some((i) => politica.motivos_requieren_evidencia.includes(i.motivo));

  return { permitida: errores.length === 0, errores, advertencias, requiere_aprobacion, requiere_evidencia };
}

/** Estado inicial al confirmar la devolución, según la evaluación de política. */
export function estadoInicial(ev) {
  return ev.requiere_aprobacion ? "pendiente_aprobacion" : "pendiente_revision";
}
