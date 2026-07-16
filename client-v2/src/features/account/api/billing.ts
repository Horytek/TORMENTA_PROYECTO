import api from "@/api/axios";
import type { MpPayment, PlanChangeInput, PreferenceInput } from "../types";

export const getMpPayments = async (): Promise<MpPayment[]> => {
  const res = await api.get("/mp");
  const data = res.data;
  return Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
};

export const createPreference = async (input: PreferenceInput): Promise<{ success: boolean; id?: string; message?: string }> => {
  try {
    const res = await api.post("/create_preference", input);
    return { success: true, id: res.data?.id };
  } catch (err) {
    const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
    return { success: false, message: message || "Error al crear preferencia de pago" };
  }
};

export const requestPlanChange = async (input: PlanChangeInput): Promise<{ success: boolean; message?: string }> => {
  try {
    const res = await api.post("/plan-change", input);
    return { success: res.data?.success ?? res.data?.code === 1, message: res.data?.message };
  } catch (err) {
    const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
    return { success: false, message: message || "Error al enviar la solicitud" };
  }
};
