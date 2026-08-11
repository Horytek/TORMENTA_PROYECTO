/** Planes SaaS Ecommerce — sincronizar con client-v2 ECOMMERCE_PLANS y tabla plan (db_ecommerce). */

export const ECOMMERCE_PLANS_CONFIG = {
  starter: {
    id: 1,
    codigo: "starter",
    nombre: "Starter",
    monthly: 79,
    currency: "PEN",
    currencySymbol: "S/",
  },
  pro: {
    id: 2,
    codigo: "pro",
    nombre: "Pro",
    monthly: 129,
    currency: "PEN",
    currencySymbol: "S/",
  },
};

export function getEcommercePlan(codigo) {
  const plan = ECOMMERCE_PLANS_CONFIG[String(codigo || "").toLowerCase()];
  if (!plan) {
    return { isValid: false, error: "Plan no encontrado" };
  }
  return { ...plan, isValid: true, price: plan.monthly };
}

export function validateEcommercePlanPrice(codigo, price) {
  const plan = getEcommercePlan(codigo);
  return plan.isValid && Number(plan.price) === Number(price);
}
