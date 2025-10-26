import axios from "./axios";

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