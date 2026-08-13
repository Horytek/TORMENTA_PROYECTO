/**
 * Disponibilidad de vitrina: stock registrado ≠ disponibilidad confirmada.
 * No muta inventario. WhatsApp solo inicia la conversación.
 */

export const ESTADOS = {
  disponible: {
    codigo: "disponible",
    label: "Disponible",
    hint: "Disponible para compra",
    confianza: null,
  },
  limitado: {
    codigo: "limitado",
    label: "Disponibilidad limitada",
    hint: "Pocas unidades registradas",
    confianza: null,
  },
  consultar: {
    codigo: "consultar",
    label: "Consultar disponibilidad",
    hint: "Confirma disponibilidad antes de comprar",
    confianza:
      "El stock puede variar entre sucursales. Confirma disponibilidad antes de comprar.",
  },
  agotado: {
    codigo: "agotado",
    label: "Agotado",
    hint: "Actualmente no disponible",
    confianza: null,
  },
  proximamente: {
    codigo: "proximamente",
    label: "Próximamente",
    hint: "Disponible próximamente",
    confianza: null,
  },
};

export const DEFAULT_CONFIG = {
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

export const CONFIRMACION_STOCK = ["nunca", "siempre", "stock_bajo", "sucursal", "auto"];

export function parseJsonSafe(raw) {
  if (raw == null) return {};
  if (typeof raw === "object") return raw;
  try {
    const v = JSON.parse(raw);
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}

export function parseConfig(themeJson) {
  const theme = parseJsonSafe(themeJson);
  const raw = theme.disponibilidad && typeof theme.disponibilidad === "object" ? theme.disponibilidad : {};
  const umbralConsulta = Number(raw.umbral_consulta);
  const umbralAgotado = Number(raw.umbral_agotado);
  const umbralLimitado = Number(raw.umbral_limitado);
  const umbralConfirmacion = Number(raw.umbral_confirmacion);
  const validez = Number(raw.validez_confirmacion_min);
  const reservaCheckout = Number(raw.reserva_checkout_min);
  const reservaMinutos = Number(raw.reserva_minutos);
  return {
    consulta_activa: raw.consulta_activa !== false,
    metodo_default: ["auto", "directa", "consultar", "ambos"].includes(raw.metodo_default)
      ? raw.metodo_default
      : DEFAULT_CONFIG.metodo_default,
    umbral_consulta: Number.isFinite(umbralConsulta) ? Math.max(0, umbralConsulta) : DEFAULT_CONFIG.umbral_consulta,
    umbral_agotado: Number.isFinite(umbralAgotado) ? Math.max(0, umbralAgotado) : DEFAULT_CONFIG.umbral_agotado,
    umbral_limitado: Number.isFinite(umbralLimitado) ? Math.max(0, umbralLimitado) : DEFAULT_CONFIG.umbral_limitado,
    umbral_confirmacion: Number.isFinite(umbralConfirmacion)
      ? Math.max(0, umbralConfirmacion)
      : Number.isFinite(umbralConsulta)
        ? Math.max(0, umbralConsulta)
        : DEFAULT_CONFIG.umbral_confirmacion,
    mostrar_boton_producto: raw.mostrar_boton_producto !== false,
    mostrar_boton_variante: raw.mostrar_boton_variante !== false,
    mensaje_confianza:
      typeof raw.mensaje_confianza === "string" && raw.mensaje_confianza.trim()
        ? raw.mensaje_confianza.trim()
        : DEFAULT_CONFIG.mensaje_confianza,
    mensaje_leyenda_stock:
      typeof raw.mensaje_leyenda_stock === "string" && raw.mensaje_leyenda_stock.trim()
        ? raw.mensaje_leyenda_stock.trim()
        : DEFAULT_CONFIG.mensaje_leyenda_stock,
    mensaje_intro:
      typeof raw.mensaje_intro === "string" && raw.mensaje_intro.trim()
        ? raw.mensaje_intro.trim()
        : DEFAULT_CONFIG.mensaje_intro,
    validez_confirmacion_min: Number.isFinite(validez) && validez > 0 ? validez : DEFAULT_CONFIG.validez_confirmacion_min,
    reserva_checkout_min:
      Number.isFinite(reservaCheckout) && reservaCheckout > 0
        ? reservaCheckout
        : DEFAULT_CONFIG.reserva_checkout_min,
    permitir_checkout_parcial: raw.permitir_checkout_parcial === true,
    solicitudes_activas: raw.solicitudes_activas !== false,
    reserva_al_aprobar: raw.reserva_al_aprobar !== false,
    reserva_minutos:
      Number.isFinite(reservaMinutos) && reservaMinutos > 0
        ? reservaMinutos
        : DEFAULT_CONFIG.reserva_minutos,
    permitir_aprobacion_parcial: raw.permitir_aprobacion_parcial !== false,
    congelar_precio_al_aprobar: raw.congelar_precio_al_aprobar === true,
    permitir_solicitud_invitado: raw.permitir_solicitud_invitado === true,
  };
}

export function parseProductoCompra(attrsJson) {
  const attrs = parseJsonSafe(attrsJson);
  const compra = attrs.compra && typeof attrs.compra === "object" ? attrs.compra : {};
  const metodo = ["auto", "directa", "consultar", "ambos"].includes(compra.metodo) ? compra.metodo : "auto";
  const disponibilidad = [
    "auto",
    "disponible",
    "limitado",
    "consultar",
    "agotado",
    "proximamente",
  ].includes(compra.disponibilidad)
    ? compra.disponibilidad
    : "auto";
  const umbralLimitadoRaw = Number(compra.umbral_limitado);
  const umbral_limitado = Number.isFinite(umbralLimitadoRaw) ? Math.max(0, umbralLimitadoRaw) : undefined;
  const confirmacion_stock = CONFIRMACION_STOCK.includes(compra.confirmacion_stock)
    ? compra.confirmacion_stock
    : "auto";
  return { metodo, disponibilidad, umbral_limitado, confirmacion_stock };
}

/**
 * ¿El producto exige solicitud de confirmación antes de comprar?
 * @param {{ stockRegistrado, confirmacionStock, config, sucursalRequiereConfirmacion?, tieneAutorizacionVigente?, hasSeleccionAttrs? }}
 */
export function requiresSolicitud({
  stockRegistrado,
  confirmacionStock = "auto",
  config,
  sucursalRequiereConfirmacion = false,
  tieneAutorizacionVigente = false,
  hasSeleccionAttrs = false,
}) {
  if (tieneAutorizacionVigente) return false;
  const cfg = { ...DEFAULT_CONFIG, ...(config || {}) };
  if (cfg.solicitudes_activas === false) return false;
  const mode = CONFIRMACION_STOCK.includes(confirmacionStock) ? confirmacionStock : "auto";
  if (mode === "nunca") return false;
  if (mode === "siempre") return true;
  const stock = Math.max(0, Number(stockRegistrado) || 0);
  if (stock <= cfg.umbral_agotado) return false; // agotado: no solicitud, no compra
  if (mode === "sucursal") return Boolean(sucursalRequiereConfirmacion);
  // stock_bajo | auto — umbral de stock bajo
  const umbral = cfg.umbral_confirmacion ?? cfg.umbral_consulta;
  if (stock <= umbral) return true;
  // auto: talla/color/etc. = combinación física a confirmar (stock registrado ≠ pieza exacta)
  if (mode === "auto" && hasSeleccionAttrs) return true;
  return false;
}

/**
 * Orden: manual → agotado → solicitud/consultar → limitado → disponible
 */
export function resolveEstado({
  stockRegistrado,
  metodoCompra,
  manual,
  config,
  umbralLimitadoProducto,
  confirmacionStock,
  sucursalRequiereConfirmacion,
  tieneAutorizacionVigente,
  hasSeleccionAttrs = false,
}) {
  const cfg = { ...DEFAULT_CONFIG, ...(config || {}) };
  if (manual && manual !== "auto" && ESTADOS[manual]) {
    if (manual === "disponible" || manual === "limitado") {
      const needs = requiresSolicitud({
        stockRegistrado,
        confirmacionStock,
        config: cfg,
        sucursalRequiereConfirmacion,
        tieneAutorizacionVigente,
        hasSeleccionAttrs,
      });
      if (needs) return "consultar";
    }
    return manual;
  }
  const stock = Math.max(0, Number(stockRegistrado) || 0);
  if (stock <= cfg.umbral_agotado) return "agotado";

  if (
    requiresSolicitud({
      stockRegistrado: stock,
      confirmacionStock,
      config: cfg,
      sucursalRequiereConfirmacion,
      tieneAutorizacionVigente,
      hasSeleccionAttrs,
    })
  ) {
    return "consultar";
  }

  const metodo = metodoCompra && metodoCompra !== "auto" ? metodoCompra : cfg.metodo_default;
  if (cfg.consulta_activa && metodo === "consultar") return "consultar";
  if (cfg.consulta_activa && stock <= cfg.umbral_consulta) return "consultar";

  const umbralLimitado = Number.isFinite(Number(umbralLimitadoProducto))
    ? Math.max(0, Number(umbralLimitadoProducto))
    : cfg.umbral_limitado;
  if (stock <= umbralLimitado) return "limitado";
  return "disponible";
}

export function resolveCta({
  estado,
  metodoCompra,
  config,
  requiresSolicitudFlag = false,
  tieneAutorizacionVigente = false,
}) {
  const cfg = { ...DEFAULT_CONFIG, ...(config || {}) };
  const metodo = metodoCompra && metodoCompra !== "auto" ? metodoCompra : cfg.metodo_default;

  if (estado === "agotado") {
    return {
      primary: null,
      showCart: false,
      showWhatsapp: false,
      allowAddToCart: false,
      requiresSolicitud: false,
      showEnviarSolicitud: false,
    };
  }

  if (tieneAutorizacionVigente) {
    return {
      primary: "cart",
      showCart: true,
      showWhatsapp: true,
      allowAddToCart: true,
      requiresSolicitud: false,
      showEnviarSolicitud: false,
    };
  }

  if (requiresSolicitudFlag || estado === "consultar") {
    return {
      primary: "solicitud",
      showCart: false,
      showWhatsapp: true,
      allowAddToCart: false,
      requiresSolicitud: true,
      showEnviarSolicitud: true,
    };
  }

  if (estado === "proximamente") {
    return {
      primary: "whatsapp",
      showCart: false,
      showWhatsapp: true,
      allowAddToCart: false,
      requiresSolicitud: false,
      showEnviarSolicitud: false,
    };
  }
  if (metodo === "consultar") {
    return {
      primary: "solicitud",
      showCart: false,
      showWhatsapp: true,
      allowAddToCart: false,
      requiresSolicitud: true,
      showEnviarSolicitud: true,
    };
  }
  if (estado === "limitado") {
    return {
      primary: "cart",
      showCart: true,
      showWhatsapp: true,
      allowAddToCart: true,
      requiresSolicitud: false,
      showEnviarSolicitud: false,
    };
  }
  const showWa = metodo === "ambos" || cfg.mostrar_boton_producto;
  return {
    primary: "cart",
    showCart: true,
    showWhatsapp: showWa,
    allowAddToCart: true,
    requiresSolicitud: false,
    showEnviarSolicitud: false,
  };
}

export function buildDisponibilidad(stockRegistrado, attrsJson, config, extras = {}) {
  const compra = parseProductoCompra(attrsJson);
  const needsSolicitud = requiresSolicitud({
    stockRegistrado,
    confirmacionStock: compra.confirmacion_stock,
    config,
    sucursalRequiereConfirmacion: extras.sucursalRequiereConfirmacion,
    tieneAutorizacionVigente: extras.tieneAutorizacionVigente,
    hasSeleccionAttrs: Boolean(extras.hasSeleccionAttrs),
  });
  const estado = resolveEstado({
    stockRegistrado,
    metodoCompra: compra.metodo,
    manual: compra.disponibilidad,
    config,
    umbralLimitadoProducto: compra.umbral_limitado,
    confirmacionStock: compra.confirmacion_stock,
    sucursalRequiereConfirmacion: extras.sucursalRequiereConfirmacion,
    tieneAutorizacionVigente: extras.tieneAutorizacionVigente,
    hasSeleccionAttrs: Boolean(extras.hasSeleccionAttrs),
  });
  const meta = ESTADOS[estado];
  const cta = resolveCta({
    estado,
    metodoCompra: compra.metodo,
    config,
    requiresSolicitudFlag: needsSolicitud,
    tieneAutorizacionVigente: extras.tieneAutorizacionVigente,
  });
  let confianza = null;
  if (estado === "consultar" || needsSolicitud) {
    confianza =
      config?.mensaje_confianza ||
      "Confirma la disponibilidad antes de comprar.";
  } else if (estado === "limitado") {
    confianza = config?.mensaje_confianza || config?.mensaje_leyenda_stock || meta.confianza;
  }
  return {
    estado,
    stock_registrado: Math.max(0, Number(stockRegistrado) || 0),
    label: needsSolicitud ? "Confirmar disponibilidad" : meta.label,
    hint: needsSolicitud ? "Confirma la disponibilidad antes de comprar." : meta.hint,
    confianza,
    metodo_compra: compra.metodo,
    disponibilidad_manual: compra.disponibilidad,
    confirmacion_stock: compra.confirmacion_stock,
    cta,
  };
}

export function attachDisponibilidad(producto, config, extras = {}) {
  const disp = buildDisponibilidad(producto.stock, producto.attrs_json, config, extras);
  return { ...producto, disponibilidad: disp };
}

/** ¿El producto pide al cliente elegir talla/color/etc.? */
export async function productHasSeleccionAttrs(connection, id_tienda, id_producto) {
  // Talla/color/etc.: requiere_seleccion O atributo variante (stock registrado ≠ pieza física).
  const [[row]] = await connection.query(
    `SELECT 1 AS ok
     FROM ecom_producto_atributo pa
     JOIN ecom_atributo a ON a.id_atributo = pa.id_atributo AND a.id_tienda = pa.id_tienda
     WHERE pa.id_tienda = ? AND pa.id_producto = ?
       AND (pa.requiere_seleccion = 1 OR a.es_variante = 1)
     LIMIT 1`,
    [id_tienda, id_producto]
  );
  return Boolean(row);
}

export async function loadTiendaConfig(connection, id_tienda) {
  const [[tienda]] = await connection.query(
    `SELECT theme_json FROM tienda WHERE id_tienda = ? LIMIT 1`,
    [id_tienda]
  );
  return parseConfig(tienda?.theme_json);
}

export async function registrarConsulta(connection, row) {
  try {
    await connection.query(
      `INSERT INTO ecom_consulta_disponibilidad
        (id_tienda, id_producto, id_variante, id_sucursal, cantidad, attrs_snapshot, canal, origen)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        row.id_tienda,
        row.id_producto,
        row.id_variante || null,
        row.id_sucursal || null,
        row.cantidad || 1,
        row.attrs_snapshot ? JSON.stringify(row.attrs_snapshot) : null,
        row.canal || "whatsapp",
        row.origen || "producto",
      ]
    );
    return true;
  } catch (err) {
    if (err?.code === "ER_NO_SUCH_TABLE") return false;
    throw err;
  }
}

export async function registrarIntentoSinStock(connection, row) {
  try {
    await connection.query(
      `INSERT INTO ecom_intento_sin_stock
        (id_tienda, id_producto, id_variante, id_sucursal, cantidad, origen, mensaje)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        row.id_tienda,
        row.id_producto,
        row.id_variante || null,
        row.id_sucursal || null,
        row.cantidad || 1,
        row.origen || "validate",
        row.mensaje ? String(row.mensaje).slice(0, 255) : null,
      ]
    );
    return true;
  } catch (err) {
    if (err?.code === "ER_NO_SUCH_TABLE") return false;
    throw err;
  }
}
