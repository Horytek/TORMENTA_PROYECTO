import { createPreferenceRequest } from "@/api/api.payment";

export const createPreference = async (paymentData) => {
  return await createPreferenceRequest(paymentData);
};