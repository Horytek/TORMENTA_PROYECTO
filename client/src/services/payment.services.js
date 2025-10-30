import {
  createPreferenceRequest,
  getMpPaymentsRequest,
  createPreapprovalRequest,
  requestPlanChangeRequest
} from "@/api/api.payment";

// Crear preferencia de pago (Mercado Pago)
export const createPreference = async (paymentData) => {
  return await createPreferenceRequest(paymentData);
};

// Obtener historial de pagos de Mercado Pago
export const getMpPayments = async (params = {}) => {
  return await getMpPaymentsRequest(params);
};

// Crear suscripción/renovación automática
export const createPreapproval = async (payload) => {
  return await createPreapprovalRequest(payload);
};

// Solicitud de cambio de plan
export const requestPlanChange = async (payload) => {
  return await requestPlanChangeRequest(payload);
};