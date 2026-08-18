/**
 * Estados de BD → etiqueta humana.
 * Conserva el código interno; la UI nunca muestra snake_case.
 */
export type AtelierStatusTone = "quiet" | "accent" | "progress" | "done" | "warn" | "stop";

export type AtelierStatusMeta = {
  label: string;
  tone: AtelierStatusTone;
};

const REQUEST_AND_ORDER: Record<string, AtelierStatusMeta> = {
  draft: { label: "Borrador", tone: "quiet" },
  submitted: { label: "Brief publicado", tone: "progress" },
  quote_sent: { label: "Propuesta recibida", tone: "accent" },
  accepted: { label: "Propuesta aceptada", tone: "progress" },
  payment_pending: { label: "Pago pendiente", tone: "warn" },
  paid: { label: "Pagado", tone: "progress" },
  in_progress: { label: "En progreso", tone: "progress" },
  preview: { label: "En revisión", tone: "accent" },
  revision: { label: "En revisión", tone: "accent" },
  final_delivery: { label: "Obra terminada", tone: "done" },
  completed: { label: "Entregada", tone: "done" },
  rejected: { label: "Propuesta rechazada", tone: "stop" },
  cancelled: { label: "Cancelado", tone: "stop" },
  disputed: { label: "En disputa", tone: "warn" },
  refunded: { label: "Reembolsado", tone: "quiet" },
  expired: { label: "Expirado", tone: "quiet" },
};

const QUOTE: Record<string, AtelierStatusMeta> = {
  sent: { label: "Propuesta enviada", tone: "progress" },
  accepted: { label: "Aceptada", tone: "done" },
  rejected: { label: "Rechazada", tone: "stop" },
  expired: { label: "Expirada", tone: "quiet" },
};

export function atelierStatusMeta(estado: string, kind: "order" | "quote" = "order"): AtelierStatusMeta {
  const map = kind === "quote" ? QUOTE : REQUEST_AND_ORDER;
  return map[estado] ?? { label: estado.replaceAll("_", " "), tone: "quiet" };
}
