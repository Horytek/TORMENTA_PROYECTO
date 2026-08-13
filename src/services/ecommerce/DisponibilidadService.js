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
  mostrar_boton_producto: true,
  mostrar_boton_variante: true,
  mensaje_confianza:
    "El stock puede variar entre sucursales. Confirma disponibilidad antes de comprar.",
  mensaje_intro: "Hola, quisiera consultar la disponibilidad de este producto:",
  validez_confirmacion_min: 120,
};

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
  const validez = Number(raw.validez_confirmacion_min);
  return {
    consulta_activa: raw.consulta_activa !== false,
    metodo_default: ["auto", "directa", "consultar", "ambos"].includes(raw.metodo_default)
      ? raw.metodo_default
      : DEFAULT_CONFIG.metodo_default,
    umbral_consulta: Number.isFinite(umbralConsulta) ? Math.max(0, umbralConsulta) : DEFAULT_CONFIG.umbral_consulta,
    umbral_agotado: Number.isFinite(umbralAgotado) ? Math.max(0, umbralAgotado) : DEFAULT_CONFIG.umbral_agotado,
    mostrar_boton_producto: raw.mostrar_boton_producto !== false,
    mostrar_boton_variante: raw.mostrar_boton_variante !== false,
    mensaje_confianza:
      typeof raw.mensaje_confianza === "string" && raw.mensaje_confianza.trim()
        ? raw.mensaje_confianza.trim()
        : DEFAULT_CONFIG.mensaje_confianza,
    mensaje_intro:
      typeof raw.mensaje_intro === "string" && raw.mensaje_intro.trim()
        ? raw.mensaje_intro.trim()
        : DEFAULT_CONFIG.mensaje_intro,
    validez_confirmacion_min: Number.isFinite(validez) && validez > 0 ? validez : DEFAULT_CONFIG.validez_confirmacion_min,
  };
}

export function parseProductoCompra(attrsJson) {
  const attrs = parseJsonSafe(attrsJson);
  const compra = attrs.compra && typeof attrs.compra === "object" ? attrs.compra : {};
  const metodo = ["auto", "directa", "consultar", "ambos"].includes(compra.metodo) ? compra.metodo : "auto";
  const disponibilidad = ["auto", "disponible", "consultar", "agotado", "proximamente"].includes(
    compra.disponibilidad
  )
    ? compra.disponibilidad
    : "auto";
  return { metodo, disponibilidad };
}

export function resolveEstado({ stockRegistrado, metodoCompra, manual, config }) {
  const cfg = { ...DEFAULT_CONFIG, ...(config || {}) };
  if (manual && manual !== "auto" && ESTADOS[manual]) return manual;
  const stock = Math.max(0, Number(stockRegistrado) || 0);
  if (stock <= cfg.umbral_agotado) return "agotado";
  if (!cfg.consulta_activa) return "disponible";
  const metodo = metodoCompra && metodoCompra !== "auto" ? metodoCompra : cfg.metodo_default;
  if (metodo === "consultar") return "consultar";
  if (stock <= cfg.umbral_consulta) return "consultar";
  return "disponible";
}

export function resolveCta({ estado, metodoCompra, config }) {
  const cfg = { ...DEFAULT_CONFIG, ...(config || {}) };
  const metodo = metodoCompra && metodoCompra !== "auto" ? metodoCompra : cfg.metodo_default;

  if (estado === "agotado") {
    return { primary: null, showCart: false, showWhatsapp: false, allowAddToCart: false };
  }
  if (estado === "proximamente") {
    return { primary: "whatsapp", showCart: false, showWhatsapp: true, allowAddToCart: false };
  }
  if (estado === "consultar") {
    return { primary: "whatsapp", showCart: false, showWhatsapp: true, allowAddToCart: false };
  }
  if (metodo === "consultar") {
    return { primary: "whatsapp", showCart: false, showWhatsapp: true, allowAddToCart: false };
  }
  const showWa = metodo === "ambos" || cfg.mostrar_boton_producto;
  return {
    primary: "cart",
    showCart: true,
    showWhatsapp: showWa,
    allowAddToCart: true,
  };
}

export function buildDisponibilidad(stockRegistrado, attrsJson, config) {
  const compra = parseProductoCompra(attrsJson);
  const estado = resolveEstado({
    stockRegistrado,
    metodoCompra: compra.metodo,
    manual: compra.disponibilidad,
    config,
  });
  const meta = ESTADOS[estado];
  const cta = resolveCta({ estado, metodoCompra: compra.metodo, config });
  return {
    estado,
    stock_registrado: Math.max(0, Number(stockRegistrado) || 0),
    label: meta.label,
    hint: meta.hint,
    confianza: estado === "consultar" ? config?.mensaje_confianza || meta.confianza : null,
    metodo_compra: compra.metodo,
    disponibilidad_manual: compra.disponibilidad,
    cta,
  };
}

export function attachDisponibilidad(producto, config) {
  const disp = buildDisponibilidad(producto.stock, producto.attrs_json, config);
  return { ...producto, disponibilidad: disp };
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
