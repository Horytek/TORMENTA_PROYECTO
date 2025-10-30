import axios from "./axios";

// Crear preferencia de pago (Mercado Pago)
export async function createPreferenceRequest(paymentData) {
  try {
    const { data } = await axios.post("/create_preference", paymentData);
    return { success: true, id: data?.id };
  } catch (e) {
    const data = e?.response?.data;
    const msg = data?.message || e.message || "Error al crear preferencia";
    return { success: false, message: msg, details: data || null };
  }
}

// Obtener historial de pagos de Mercado Pago (requiere autenticación)
export async function getMpPaymentsRequest(params = {}) {
  try {
    const { data } = await axios.get("/mp", { params });
    return data;
  } catch (e) {
    return { success: false, message: e?.message || "Error al obtener pagos" };
  }
}

// Crear suscripción/renovación automática (requiere autenticación)
export async function createPreapprovalRequest(payload) {
  try {
    const { data } = await axios.post("/preapproval", payload);
    return data;
  } catch (e) {
    return { success: false, message: e?.message || "Error al crear preapproval" };
  }
}

// Solicitud de cambio de plan (requiere autenticación)
export async function requestPlanChangeRequest(payload) {
  try {
    const { data } = await axios.post("/plan-change", payload);
    return data;
  } catch (e) {
    return { success: false, message: e?.message || "Error al solicitar cambio de plan" };
  }
}