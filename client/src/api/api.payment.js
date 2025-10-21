import axios from "@/api/axios";

export async function createPreferenceRequest(paymentData) {
  try {
    const { data } = await axios.post("/create_preference", paymentData);
    return { success: true, id: data?.id };
  } catch (e) {
    const msg = e?.response?.data?.message || e.message || "Error al crear preferencia";
    return { success: false, message: msg };
  }
}