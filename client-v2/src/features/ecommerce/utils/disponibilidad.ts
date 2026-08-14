export type MetodoCompra = "auto" | "directa" | "consultar" | "ambos";
export type EstadoDisponibilidad =
  | "disponible"
  | "limitado"
  | "consultar"
  | "agotado"
  | "proximamente";
export type DisponibilidadManual = "auto" | EstadoDisponibilidad;
export type ConfirmacionStock = "nunca" | "siempre" | "stock_bajo" | "sucursal" | "auto";

export type DisponibilidadConfig = {
  consulta_activa: boolean;
  metodo_default: MetodoCompra;
  umbral_consulta: number;
  umbral_agotado: number;
  umbral_limitado: number;
  umbral_confirmacion: number;
  mostrar_boton_producto: boolean;
  mostrar_boton_variante: boolean;
  mensaje_confianza: string;
  mensaje_leyenda_stock: string;
  mensaje_intro: string;
  validez_confirmacion_min: number;
  reserva_checkout_min: number;
  permitir_checkout_parcial: boolean;
  solicitudes_activas: boolean;
  reserva_al_aprobar: boolean;
  reserva_minutos: number;
  permitir_aprobacion_parcial: boolean;
  congelar_precio_al_aprobar: boolean;
  permitir_solicitud_invitado: boolean;
};

export type DisponibilidadCta = {
  primary: "whatsapp" | "cart" | "solicitud" | null;
  showCart: boolean;
  showWhatsapp: boolean;
  allowAddToCart: boolean;
  requiresSolicitud: boolean;
  showEnviarSolicitud: boolean;
};

export type Disponibilidad = {
  estado: EstadoDisponibilidad;
  stock_registrado: number;
  label: string;
  hint: string;
  confianza: string | null;
  metodo_compra: MetodoCompra;
  disponibilidad_manual: DisponibilidadManual;
  confirmacion_stock: ConfirmacionStock;
  cta: DisponibilidadCta;
};

export const DEFAULT_DISP_CONFIG: DisponibilidadConfig = {
  consulta_activa: true,
  metodo_default: "auto",
  umbral_consulta: 2,
  umbral_agotado: 0,
  umbral_limitado: 3,
  umbral_confirmacion: 2,
  mostrar_boton_producto: true,
  mostrar_boton_variante: true,
  mensaje_confianza:
    "El stock puede variar entre sucursales. Confirma disponibilidad antes de comprar.",
  mensaje_leyenda_stock:
    "Ante cualquier eventualidad, te recomendamos confirmar el stock por WhatsApp antes de completar tu compra.",
  mensaje_intro: "Hola, quisiera consultar la disponibilidad de este producto:",
  validez_confirmacion_min: 120,
  reserva_checkout_min: 15,
  permitir_checkout_parcial: false,
  solicitudes_activas: true,
  reserva_al_aprobar: true,
  reserva_minutos: 30,
  permitir_aprobacion_parcial: true,
  congelar_precio_al_aprobar: false,
  permitir_solicitud_invitado: false,
};

const META: Record<EstadoDisponibilidad, { label: string; hint: string }> = {
  disponible: { label: "Disponible", hint: "Disponible para compra" },
  limitado: {
    label: "Disponibilidad limitada",
    hint: "Pocas unidades registradas",
  },
  consultar: {
    label: "Confirmar disponibilidad",
    hint: "Confirma la disponibilidad antes de comprar",
  },
  agotado: { label: "Agotado", hint: "Actualmente no disponible" },
  proximamente: { label: "Próximamente", hint: "Disponible próximamente" },
};

function parseAttrs(raw: unknown): Record<string, unknown> {
  if (!raw) return {};
  if (typeof raw === "object") return raw as Record<string, unknown>;
  try {
    const v = JSON.parse(String(raw));
    return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export function parseProductoCompra(attrsJson: unknown): {
  metodo: MetodoCompra;
  disponibilidad: DisponibilidadManual;
  umbral_limitado?: number;
  confirmacion_stock: ConfirmacionStock;
} {
  const attrs = parseAttrs(attrsJson);
  const compra = attrs.compra && typeof attrs.compra === "object" ? (attrs.compra as Record<string, unknown>) : {};
  const metodo = ["auto", "directa", "consultar", "ambos"].includes(String(compra.metodo))
    ? (compra.metodo as MetodoCompra)
    : "auto";
  const disponibilidad = [
    "auto",
    "disponible",
    "limitado",
    "consultar",
    "agotado",
    "proximamente",
  ].includes(String(compra.disponibilidad))
    ? (compra.disponibilidad as DisponibilidadManual)
    : "auto";
  const umbralLimitadoRaw = Number(compra.umbral_limitado);
  const umbral_limitado = Number.isFinite(umbralLimitadoRaw) ? Math.max(0, umbralLimitadoRaw) : undefined;
  const confirmacion_stock = ["nunca", "siempre", "stock_bajo", "sucursal", "auto"].includes(
    String(compra.confirmacion_stock)
  )
    ? (compra.confirmacion_stock as ConfirmacionStock)
    : "auto";
  return { metodo, disponibilidad, umbral_limitado, confirmacion_stock };
}

export function requiresSolicitud(opts: {
  stockRegistrado: number;
  confirmacionStock?: ConfirmacionStock;
  config?: Partial<DisponibilidadConfig> | null;
  sucursalRequiereConfirmacion?: boolean;
  tieneAutorizacionVigente?: boolean;
  hasSeleccionAttrs?: boolean;
}): boolean {
  if (opts.tieneAutorizacionVigente) return false;
  const cfg = { ...DEFAULT_DISP_CONFIG, ...(opts.config || {}) };
  if (cfg.solicitudes_activas === false) return false;
  const mode = opts.confirmacionStock || "auto";
  if (mode === "nunca") return false;
  if (mode === "siempre") return true;
  const stock = Math.max(0, Number(opts.stockRegistrado) || 0);
  if (stock <= cfg.umbral_agotado) return false;
  if (mode === "sucursal") return Boolean(opts.sucursalRequiereConfirmacion);
  const umbral = cfg.umbral_confirmacion ?? cfg.umbral_consulta;
  if (stock <= umbral) return true;
  // Talla/color/etc.: el stock registrado no garantiza la combinación física
  if (mode === "auto" && opts.hasSeleccionAttrs) return true;
  return false;
}

/**
 * Orden: manual → agotado → solicitud/consultar → limitado → disponible
 */
export function resolveDisponibilidad(
  stockRegistrado: number,
  attrsJson: unknown,
  config?: Partial<DisponibilidadConfig> | null,
  extras?: {
    sucursalRequiereConfirmacion?: boolean;
    tieneAutorizacionVigente?: boolean;
    hasSeleccionAttrs?: boolean;
  }
): Disponibilidad {
  const cfg = { ...DEFAULT_DISP_CONFIG, ...(config || {}) };
  const compra = parseProductoCompra(attrsJson);
  const needs = requiresSolicitud({
    stockRegistrado,
    confirmacionStock: compra.confirmacion_stock,
    config: cfg,
    sucursalRequiereConfirmacion: extras?.sucursalRequiereConfirmacion,
    tieneAutorizacionVigente: extras?.tieneAutorizacionVigente,
    hasSeleccionAttrs: extras?.hasSeleccionAttrs,
  });

  let estado: EstadoDisponibilidad = "disponible";
  if (compra.disponibilidad !== "auto") {
    if (
      (compra.disponibilidad === "disponible" || compra.disponibilidad === "limitado") &&
      needs
    ) {
      estado = "consultar";
    } else {
      estado = compra.disponibilidad;
    }
  } else {
    const stock = Math.max(0, Number(stockRegistrado) || 0);
    if (stock <= cfg.umbral_agotado) {
      estado = "agotado";
    } else if (needs) {
      estado = "consultar";
    } else {
      const metodo = compra.metodo === "auto" ? cfg.metodo_default : compra.metodo;
      if (cfg.consulta_activa && metodo === "consultar") {
        estado = "consultar";
      } else if (cfg.consulta_activa && stock <= cfg.umbral_consulta) {
        estado = "consultar";
      } else {
        const umbralLimitado =
          compra.umbral_limitado !== undefined ? compra.umbral_limitado : cfg.umbral_limitado;
        if (stock <= umbralLimitado) estado = "limitado";
        else estado = "disponible";
      }
    }
  }

  const metodo = compra.metodo === "auto" ? cfg.metodo_default : compra.metodo;
  let cta: DisponibilidadCta;
  if (estado === "agotado") {
    cta = {
      primary: null,
      showCart: false,
      showWhatsapp: false,
      allowAddToCart: false,
      requiresSolicitud: false,
      showEnviarSolicitud: false,
    };
  } else if (extras?.tieneAutorizacionVigente) {
    cta = {
      primary: "cart",
      showCart: true,
      showWhatsapp: true,
      allowAddToCart: true,
      requiresSolicitud: false,
      showEnviarSolicitud: false,
    };
  } else if (needs || estado === "consultar" || metodo === "consultar") {
    cta = {
      primary: "solicitud",
      showCart: false,
      showWhatsapp: true,
      allowAddToCart: false,
      requiresSolicitud: true,
      showEnviarSolicitud: true,
    };
  } else if (estado === "proximamente") {
    cta = {
      primary: "whatsapp",
      showCart: false,
      showWhatsapp: true,
      allowAddToCart: false,
      requiresSolicitud: false,
      showEnviarSolicitud: false,
    };
  } else if (estado === "limitado") {
    cta = {
      primary: "cart",
      showCart: true,
      showWhatsapp: true,
      allowAddToCart: true,
      requiresSolicitud: false,
      showEnviarSolicitud: false,
    };
  } else {
    cta = {
      primary: "cart",
      showCart: true,
      showWhatsapp: metodo === "ambos" || cfg.mostrar_boton_producto,
      allowAddToCart: true,
      requiresSolicitud: false,
      showEnviarSolicitud: false,
    };
  }

  const meta = META[estado];
  let confianza: string | null = null;
  if (needs || estado === "consultar") {
    confianza = cfg.mensaje_confianza || "Confirma la disponibilidad antes de comprar.";
  } else if (estado === "limitado") {
    confianza = cfg.mensaje_confianza || cfg.mensaje_leyenda_stock;
  }

  return {
    estado,
    stock_registrado: Math.max(0, Number(stockRegistrado) || 0),
    label: needs ? "Confirmar disponibilidad" : meta.label,
    hint: needs ? "Confirma la disponibilidad antes de comprar." : meta.hint,
    confianza,
    metodo_compra: compra.metodo,
    disponibilidad_manual: compra.disponibilidad,
    confirmacion_stock: compra.confirmacion_stock,
    cta,
  };
}

export type ResolvedFulfillmentCta = {
  cta?: "comprar" | "solicitar" | "no_disponible" | "incomplete" | string;
  label?: string;
  hint?: string | null;
  disponibilidad?: {
    estado?: string;
    label?: string;
    hint?: string;
    cta?: {
      allowAddToCart?: boolean;
      requiresSolicitud?: boolean;
      showEnviarSolicitud?: boolean;
      showCart?: boolean;
      showWhatsapp?: boolean;
      primary?: string | null;
    };
  } | null;
};

/**
 * El resolver de fulfillment puede devolver cta "comprar" por stock local
 * aunque disponibilidad.cta ya exija solicitud (talla/color). El PDP no debe
 * pisar esa solicitud con "Comprar ahora".
 */
export function applyResolvedFulfillment(
  resolved: ResolvedFulfillmentCta | undefined,
  fallback: Disponibilidad | null
): Disponibilidad | null {
  if (!resolved?.disponibilidad || !fallback) return fallback;
  const nested = resolved.disponibilidad.cta || {};
  const needsSolicitud =
    resolved.cta === "solicitar" ||
    Boolean(nested.requiresSolicitud) ||
    Boolean(nested.showEnviarSolicitud);
  const canBuy = resolved.cta === "comprar" && !needsSolicitud;
  const noDisponible = resolved.cta === "no_disponible";

  return {
    ...fallback,
    ...resolved.disponibilidad,
    cta: {
      ...fallback.cta,
      ...nested,
      allowAddToCart: canBuy,
      showCart: canBuy,
      showWhatsapp: Boolean(nested.showWhatsapp ?? fallback.cta.showWhatsapp),
      showEnviarSolicitud: needsSolicitud,
      requiresSolicitud: needsSolicitud,
      primary: (needsSolicitud
        ? "solicitud"
        : canBuy
          ? "cart"
          : fallback.cta.primary) as DisponibilidadCta["primary"],
    },
    label: needsSolicitud
      ? resolved.disponibilidad.label || fallback.label
      : resolved.label || resolved.disponibilidad.label || fallback.label,
    hint:
      (needsSolicitud
        ? resolved.disponibilidad.hint || fallback.hint
        : resolved.hint || resolved.disponibilidad.hint || fallback.hint) || "",
    estado: canBuy
      ? "disponible"
      : needsSolicitud
        ? "consultar"
        : noDisponible
          ? "agotado"
          : (resolved.disponibilidad.estado as EstadoDisponibilidad) || fallback.estado,
  };
}

export function labelCtaPrincipal(
  resolved: ResolvedFulfillmentCta | undefined,
  disp: Disponibilidad | null
): string {
  if (disp?.cta.showEnviarSolicitud || resolved?.cta === "solicitar") {
    return "Solicitar disponibilidad";
  }
  if (resolved?.cta === "no_disponible") return "No disponible";
  if (resolved?.cta === "incomplete") return "Elige cómo recibirlo";
  return "Comprar ahora";
}
