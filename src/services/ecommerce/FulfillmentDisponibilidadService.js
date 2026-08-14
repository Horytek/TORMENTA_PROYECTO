/**
 * Resuelve disponibilidad inmediata vs otra ubicación vs agotado
 * según fulfillment (pickup / delivery / provincia).
 */
import { getStockPorProductoSucursal } from "./InventoryService.js";
import { listSucursalesActivas, getSucursal } from "./BranchService.js";
import { cotizarEntrega } from "./DeliveryQuoteService.js";
import { buildDisponibilidad, parseConfig } from "./DisponibilidadService.js";

function calcDisp(row) {
  if (!row) return 0;
  return Math.max(
    0,
    (Number(row.stock_fisico) || 0) - (Number(row.reservado) || 0) - (Number(row.comprometido) || 0)
  );
}

/**
 * Stock de una variante (o suma del producto) en una sucursal.
 */
export async function stockEnSucursal(connection, {
  id_tienda,
  id_producto,
  id_variante = null,
  id_sucursal,
}) {
  if (!id_sucursal) return 0;
  const rows = await getStockPorProductoSucursal(
    connection,
    id_tienda,
    id_producto,
    id_sucursal
  );
  if (id_variante) {
    const v = rows.find((r) => Number(r.id_variante) === Number(id_variante));
    return v ? Number(v.disponible) || 0 : 0;
  }
  return rows.reduce((acc, r) => acc + (Number(r.disponible) || 0), 0);
}

/**
 * Otras sucursales con stock ≥ cantidad (excluye destino).
 */
export async function buscarOtrasUbicaciones(connection, {
  id_tienda,
  id_producto,
  id_variante = null,
  cantidad = 1,
  exclude_sucursal = null,
}) {
  const qty = Math.max(1, Number(cantidad) || 1);
  const sucursales = await listSucursalesActivas(connection, id_tienda);
  const halladas = [];
  for (const s of sucursales) {
    if (exclude_sucursal && Number(s.id_sucursal) === Number(exclude_sucursal)) continue;
    const stock = await stockEnSucursal(connection, {
      id_tienda,
      id_producto,
      id_variante,
      id_sucursal: s.id_sucursal,
    });
    if (stock >= qty) {
      halladas.push({
        id_sucursal: s.id_sucursal,
        nombre: s.nombre,
        disponible: stock,
      });
    }
  }
  halladas.sort((a, b) => b.disponible - a.disponible);
  return halladas;
}

/**
 * Resuelve la sucursal que atenderá según fulfillment.
 */
export async function resolveSucursalAtencion(connection, {
  id_tienda,
  fulfillment = "pickup",
  id_sucursal = null,
  id_zona = null,
  distrito = null,
  lat = null,
  lng = null,
  subtotal = 0,
}) {
  const mode = fulfillment === "retiro" ? "pickup" : fulfillment;

  if (mode === "pickup") {
    if (!id_sucursal) {
      return { ok: false, motivo: "Elige una sucursal de recojo.", id_sucursal: null };
    }
    const suc = await getSucursal(connection, id_tienda, id_sucursal);
    if (!suc || !suc.activo) {
      return { ok: false, motivo: "Sucursal no disponible.", id_sucursal: null };
    }
    if (suc.allow_pickup === 0 || suc.allow_pickup === false) {
      return { ok: false, motivo: "Esta sucursal no admite recojo.", id_sucursal: null };
    }
    return { ok: true, id_sucursal: Number(suc.id_sucursal), sucursal: suc };
  }

  if (mode === "delivery" || mode === "provincia") {
    const quote = await cotizarEntrega(connection, {
      id_tienda,
      fulfillment: mode,
      subtotal,
      id_sucursal: id_sucursal || null,
      id_zona: id_zona || null,
      id_destino: null,
      punto:
        lat != null && lng != null
          ? { lat: Number(lat), lng: Number(lng) }
          : null,
    });
    if (!quote.disponible) {
      return {
        ok: false,
        motivo: quote.motivo || "Entrega no disponible en esta zona.",
        id_sucursal: null,
        quote,
      };
    }
    let sid = quote.id_sucursal || id_sucursal;
    if (!sid) {
      const activas = await listSucursalesActivas(connection, id_tienda);
      const deliveryOk =
        activas.find((s) => s.allow_delivery && s.es_default) ||
        activas.find((s) => s.allow_delivery) ||
        activas.find((s) => s.es_default) ||
        activas[0];
      sid = deliveryOk?.id_sucursal || null;
    }
    if (!sid) {
      return { ok: false, motivo: "No hay sucursal para despachar.", id_sucursal: null, quote };
    }
    return { ok: true, id_sucursal: Number(sid), quote };
  }

  return { ok: false, motivo: "Método de entrega no válido.", id_sucursal: null };
}

/**
 * Resultado orientado a vitrina (sin jerga de almacén).
 * modo: inmediata | otra_ubicacion | agotado | incompleto
 */
export async function resolveDisponibilidadFulfillment(connection, {
  id_tienda,
  id_producto,
  id_variante = null,
  cantidad = 1,
  fulfillment = "pickup",
  id_sucursal = null,
  id_zona = null,
  distrito = null,
  lat = null,
  lng = null,
  subtotal = 0,
  theme_json = null,
  attrs_json = null,
  hasSeleccionAttrs = false,
}) {
  const qty = Math.max(1, Number(cantidad) || 1);
  const mode = fulfillment === "retiro" ? "pickup" : fulfillment || "pickup";
  const cfg = parseConfig(theme_json);

  const atencion = await resolveSucursalAtencion(connection, {
    id_tienda,
    fulfillment: mode,
    id_sucursal,
    id_zona,
    distrito,
    lat,
    lng,
    subtotal,
  });

  if (!atencion.ok || !atencion.id_sucursal) {
    return {
      modo: "incompleto",
      cta: "incomplete",
      label: atencion.motivo || "Completa cómo quieres recibir el producto",
      hint: atencion.motivo || null,
      cantidad: qty,
      fulfillment: mode,
      id_sucursal: null,
      id_sucursal_origen: null,
      stock_local: 0,
      otras_ubicaciones: [],
      disponibilidad: null,
      quote: atencion.quote || null,
    };
  }

  const sid = atencion.id_sucursal;
  const stockLocal = await stockEnSucursal(connection, {
    id_tienda,
    id_producto,
    id_variante,
    id_sucursal: sid,
  });

  const sucursalRequiereConfirmacion = Boolean(atencion.sucursal?.requiere_confirmacion);
  const extras = { hasSeleccionAttrs, sucursalRequiereConfirmacion };
  const dispLocal = buildDisponibilidad(stockLocal, attrs_json, cfg, extras);

  if (stockLocal >= qty) {
    const needsSolicitud = Boolean(dispLocal?.cta?.requiresSolicitud);
    if (needsSolicitud) {
      return {
        modo: "inmediata",
        cta: "solicitar",
        label: dispLocal.label || "Confirmar disponibilidad",
        hint: dispLocal.hint || "Confirma la disponibilidad antes de comprar.",
        cantidad: qty,
        fulfillment: mode,
        id_sucursal: sid,
        id_sucursal_origen: null,
        stock_local: stockLocal,
        otras_ubicaciones: [],
        disponibilidad: dispLocal,
        quote: atencion.quote || null,
      };
    }
    return {
      modo: "inmediata",
      cta: "comprar",
      label: mode === "pickup" ? "Disponible para recoger" : "Disponible para delivery",
      hint: "Disponible para entrega inmediata",
      cantidad: qty,
      fulfillment: mode,
      id_sucursal: sid,
      id_sucursal_origen: null,
      stock_local: stockLocal,
      otras_ubicaciones: [],
      disponibilidad: dispLocal,
      quote: atencion.quote || null,
    };
  }

  const otras = await buscarOtrasUbicaciones(connection, {
    id_tienda,
    id_producto,
    id_variante,
    cantidad: qty,
    exclude_sucursal: sid,
  });

  if (otras.length > 0) {
    const base = buildDisponibilidad(Math.max(stockLocal, 1), attrs_json, cfg, {
      ...extras,
      tieneAutorizacionVigente: false,
    });
    return {
      modo: "otra_ubicacion",
      cta: "solicitar",
      label: "Disponible bajo solicitud",
      hint:
        "Este producto se encuentra disponible en otra ubicación. Podemos solicitarlo antes de confirmar tu compra.",
      cantidad: qty,
      fulfillment: mode,
      id_sucursal: sid,
      id_sucursal_origen: otras[0].id_sucursal,
      stock_local: stockLocal,
      otras_ubicaciones: otras.map((o) => ({
        id_sucursal: o.id_sucursal,
        disponible: o.disponible,
      })),
      disponibilidad: {
        ...base,
        estado: "consultar",
        stock_registrado: stockLocal,
        label: "Disponible bajo solicitud",
        hint: "Confirma la disponibilidad antes de comprar.",
        cta: {
          primary: "solicitud",
          showCart: false,
          showWhatsapp: true,
          allowAddToCart: false,
          requiresSolicitud: true,
          showEnviarSolicitud: true,
        },
      },
      quote: atencion.quote || null,
    };
  }

  return {
    modo: "agotado",
    cta: "no_disponible",
    label: "Producto no disponible actualmente",
    hint: "No hay unidades suficientes en ninguna ubicación.",
    cantidad: qty,
    fulfillment: mode,
    id_sucursal: sid,
    id_sucursal_origen: null,
    stock_local: stockLocal,
    otras_ubicaciones: [],
    disponibilidad: buildDisponibilidad(0, attrs_json, cfg, extras),
    quote: atencion.quote || null,
  };
}

/** Badge de línea de carrito */
export function badgeFromModo(modo) {
  if (modo === "inmediata") return "inmediata";
  if (modo === "otra_ubicacion") return "solicitud";
  if (modo === "incompleto") return "pendiente";
  return "no_disponible";
}

export { calcDisp };
