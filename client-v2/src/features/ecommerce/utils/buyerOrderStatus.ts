/** Badge visual simple para el comprador (oculta ruido de pago_*). */
export type BuyerBadgeKind = "preparando" | "listo" | "entregado" | "cancelado";

export function buyerBadgeFromFulfillment(estado?: string | null): {
  kind: BuyerBadgeKind;
  label: string;
} {
  switch (estado) {
    case "listo_recoger":
      return { kind: "listo", label: "Listo para recoger" };
    case "entregado":
      return { kind: "entregado", label: "Entregado" };
    case "cancelado":
      return { kind: "cancelado", label: "Cancelado" };
    case "preparando":
    case "pago_confirmado":
    case "pago_pendiente":
    case "pendiente_confirmacion":
    default:
      return { kind: "preparando", label: "Preparando" };
  }
}

export const BUYER_BADGE_CLASS: Record<BuyerBadgeKind, string> = {
  preparando: "bg-amber-100 text-amber-900",
  listo: "bg-emerald-100 text-emerald-900",
  entregado: "bg-stone-100 text-stone-600",
  cancelado: "bg-red-100 text-red-800",
};

/**
 * Stub para notificaciones futuras (WhatsApp / email / push) cuando el pedido
 * pasa a listo_recoger. Hoy no-op; no llamar APIs externas.
 */
export function notifyPickupReady(_payload: {
  id_orden: number;
  codigo?: string;
  slug?: string;
}): void {
  // Fase 2: WhatsApp / email / push
}
