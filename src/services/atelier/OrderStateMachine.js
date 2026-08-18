/** Transiciones válidas: from → { to, roles[] } */
const REQUEST_TRANSITIONS = {
  draft: [{ to: "submitted", roles: ["cliente"] }],
  submitted: [
    { to: "quote_sent", roles: ["creador"] },
    { to: "cancelled", roles: ["cliente", "creador", "admin"] },
  ],
  quote_sent: [
    { to: "accepted", roles: ["cliente"] },
    { to: "rejected", roles: ["cliente"] },
    { to: "cancelled", roles: ["cliente", "creador", "admin"] },
  ],
  accepted: [{ to: "payment_pending", roles: ["cliente", "system"] }],
  payment_pending: [
    { to: "paid", roles: ["system"] },
    { to: "cancelled", roles: ["cliente", "admin"] },
  ],
  paid: [{ to: "in_progress", roles: ["creador"] }],
  in_progress: [{ to: "preview", roles: ["creador"] }],
  preview: [
    { to: "revision", roles: ["cliente"] },
    { to: "final_delivery", roles: ["creador"] },
  ],
  revision: [{ to: "preview", roles: ["creador"] }],
  final_delivery: [{ to: "completed", roles: ["cliente"] }],
};

const ORDER_TRANSITIONS = {
  payment_pending: [{ to: "paid", roles: ["system"] }],
  paid: [{ to: "in_progress", roles: ["creador"] }],
  in_progress: [{ to: "preview", roles: ["creador"] }],
  preview: [
    { to: "revision", roles: ["cliente"] },
    { to: "final_delivery", roles: ["creador"] },
  ],
  revision: [{ to: "preview", roles: ["creador"] }],
  final_delivery: [{ to: "completed", roles: ["cliente"] }],
};

export function canTransition(map, from, to, role) {
  const opts = map[from] || [];
  // `system` solo aplica si el caller es webhook/sistema (role === "system"), nunca un JWT.
  return opts.some((o) => o.to === to && o.roles.includes(role));
}

export function assertRequestTransition(from, to, role) {
  if (!canTransition(REQUEST_TRANSITIONS, from, to, role)) {
    const err = new Error(`Transición de solicitud no permitida: ${from} → ${to}`);
    err.status = 400;
    throw err;
  }
}

export function assertOrderTransition(from, to, role) {
  if (!canTransition(ORDER_TRANSITIONS, from, to, role)) {
    const err = new Error(`Transición de pedido no permitida: ${from} → ${to}`);
    err.status = 400;
    throw err;
  }
}

export { REQUEST_TRANSITIONS, ORDER_TRANSITIONS };
