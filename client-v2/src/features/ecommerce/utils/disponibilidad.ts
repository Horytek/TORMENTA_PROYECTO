export type MetodoCompra = "auto" | "directa" | "consultar" | "ambos";
export type EstadoDisponibilidad = "disponible" | "consultar" | "agotado" | "proximamente";
export type DisponibilidadManual = "auto" | EstadoDisponibilidad;

export type DisponibilidadConfig = {
  consulta_activa: boolean;
  metodo_default: MetodoCompra;
  umbral_consulta: number;
  umbral_agotado: number;
  mostrar_boton_producto: boolean;
  mostrar_boton_variante: boolean;
  mensaje_confianza: string;
  mensaje_intro: string;
  validez_confirmacion_min: number;
};

export type DisponibilidadCta = {
  primary: "whatsapp" | "cart" | null;
  showCart: boolean;
  showWhatsapp: boolean;
  allowAddToCart: boolean;
};

export type Disponibilidad = {
  estado: EstadoDisponibilidad;
  stock_registrado: number;
  label: string;
  hint: string;
  confianza: string | null;
  metodo_compra: MetodoCompra;
  disponibilidad_manual: DisponibilidadManual;
  cta: DisponibilidadCta;
};

export const DEFAULT_DISP_CONFIG: DisponibilidadConfig = {
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

const META: Record<
  EstadoDisponibilidad,
  { label: string; hint: string }
> = {
  disponible: { label: "Disponible", hint: "Disponible para compra" },
  consultar: {
    label: "Consultar disponibilidad",
    hint: "Confirma disponibilidad antes de comprar",
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
} {
  const attrs = parseAttrs(attrsJson);
  const compra = attrs.compra && typeof attrs.compra === "object" ? (attrs.compra as Record<string, unknown>) : {};
  const metodo = ["auto", "directa", "consultar", "ambos"].includes(String(compra.metodo))
    ? (compra.metodo as MetodoCompra)
    : "auto";
  const disponibilidad = ["auto", "disponible", "consultar", "agotado", "proximamente"].includes(
    String(compra.disponibilidad)
  )
    ? (compra.disponibilidad as DisponibilidadManual)
    : "auto";
  return { metodo, disponibilidad };
}

export function resolveDisponibilidad(
  stockRegistrado: number,
  attrsJson: unknown,
  config?: Partial<DisponibilidadConfig> | null
): Disponibilidad {
  const cfg = { ...DEFAULT_DISP_CONFIG, ...(config || {}) };
  const compra = parseProductoCompra(attrsJson);
  let estado: EstadoDisponibilidad = "disponible";
  if (compra.disponibilidad !== "auto") {
    estado = compra.disponibilidad;
  } else {
    const stock = Math.max(0, Number(stockRegistrado) || 0);
    if (stock <= cfg.umbral_agotado) estado = "agotado";
    else if (!cfg.consulta_activa) estado = "disponible";
    else {
      const metodo = compra.metodo === "auto" ? cfg.metodo_default : compra.metodo;
      if (metodo === "consultar") estado = "consultar";
      else if (stock <= cfg.umbral_consulta) estado = "consultar";
      else estado = "disponible";
    }
  }
  const metodo = compra.metodo === "auto" ? cfg.metodo_default : compra.metodo;
  let cta: DisponibilidadCta;
  if (estado === "agotado") {
    cta = { primary: null, showCart: false, showWhatsapp: false, allowAddToCart: false };
  } else if (estado === "proximamente" || estado === "consultar" || metodo === "consultar") {
    cta = { primary: "whatsapp", showCart: false, showWhatsapp: true, allowAddToCart: false };
  } else {
    cta = {
      primary: "cart",
      showCart: true,
      showWhatsapp: metodo === "ambos" || cfg.mostrar_boton_producto,
      allowAddToCart: true,
    };
  }
  const meta = META[estado];
  return {
    estado,
    stock_registrado: Math.max(0, Number(stockRegistrado) || 0),
    label: meta.label,
    hint: meta.hint,
    confianza: estado === "consultar" ? cfg.mensaje_confianza : null,
    metodo_compra: compra.metodo,
    disponibilidad_manual: compra.disponibilidad,
    cta,
  };
}
