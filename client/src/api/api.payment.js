import axios from "./axios";

// Crea preferencia de pago en el backend
export const createPreferenceRequest = (paymentData) =>
  axios.post("/payment/create_preference", paymentData);