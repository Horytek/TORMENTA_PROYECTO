import { createPreferenceRequest } from "@/api/api.payment";

export const createPreference = async (paymentData) => {
  try {
    const response = await createPreferenceRequest(paymentData);
    if (response.data && response.data.id) {
      return { success: true, id: response.data.id };
    } else {
      return { success: false, message: response.data?.message || "Error al crear preferencia" };
    }
  } catch (error) {
    return { success: false, message: error.response?.data?.message || error.message };
  }
};