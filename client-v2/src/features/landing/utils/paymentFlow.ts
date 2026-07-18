/**
 * Antes de redirigir a MercadoPago hay que recordar qué flujo de registro lo inició
 * (ERP vs Pocket), porque /success solo necesita hacer login automático en el flujo
 * Pocket — el ERP se activa vía webhook y credenciales por correo, no en el redirect.
 */
const KEY = "horytek_pending_payment_flow";

export type PaymentFlow = "erp" | "pocket";

export const setPendingPaymentFlow = (flow: PaymentFlow) => sessionStorage.setItem(KEY, flow);
export const getPendingPaymentFlow = (): PaymentFlow | null =>
  sessionStorage.getItem(KEY) as PaymentFlow | null;
export const clearPendingPaymentFlow = () => sessionStorage.removeItem(KEY);
