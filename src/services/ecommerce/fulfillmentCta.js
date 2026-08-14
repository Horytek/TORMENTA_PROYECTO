/**
 * CTA de vitrina cuando ya hay stock en la sucursal de atención.
 * Stock registrado ≠ disponibilidad confirmada (talla/color, umbral, etc.).
 */

export function resultadoStockLocal({ dispLocal, fulfillment = "pickup" }) {
  const mode = fulfillment === "retiro" ? "pickup" : fulfillment;
  const needsSolicitud = Boolean(
    dispLocal?.cta?.requiresSolicitud || dispLocal?.cta?.showEnviarSolicitud
  );
  if (needsSolicitud) {
    return {
      modo: "consultar",
      cta: "solicitar",
      label: dispLocal?.label || "Confirmar disponibilidad",
      hint: dispLocal?.hint || "Confirma la disponibilidad antes de comprar.",
      disponibilidad: {
        ...dispLocal,
        estado: "consultar",
        cta: {
          primary: "solicitud",
          showCart: false,
          showWhatsapp: dispLocal?.cta?.showWhatsapp !== false,
          allowAddToCart: false,
          requiresSolicitud: true,
          showEnviarSolicitud: true,
        },
      },
    };
  }
  return {
    modo: "inmediata",
    cta: "comprar",
    label: mode === "pickup" ? "Disponible para recoger" : "Disponible para delivery",
    hint: "Disponible para entrega inmediata",
    disponibilidad: dispLocal,
  };
}

export function badgeFromModo(modo) {
  if (modo === "inmediata") return "inmediata";
  if (modo === "otra_ubicacion" || modo === "consultar") return "solicitud";
  if (modo === "incompleto") return "pendiente";
  return "no_disponible";
}
