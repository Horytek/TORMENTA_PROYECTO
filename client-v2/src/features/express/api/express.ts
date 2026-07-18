import axios from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import { getExpressToken, setExpressToken, setExpressBusinessName, removeExpressToken, removeExpressBusinessName } from "@/utils/expressStorage";
import type { ExpressLoginInput, ExpressLoginResult, ExpressRegisterInput, ExpressRegisterResult, ExpressMe, ExpressVerifyResult } from "../types";

/**
 * Pocket POS (Express) es un sistema de auth y BD completamente separado del ERP
 * (JWT propio con claim `tenant_id`, tabla `express_tenants`/`express_users`).
 * Por eso usa su propia instancia de axios en vez de `@/api/axios`.
 */
const base = (() => {
  const raw = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
  if (raw) return raw.endsWith("/api") ? raw : `${raw}/api`;
  if (typeof window !== "undefined") return `${window.location.origin}/api`;
  return "/api";
})();

const expressApi = axios.create({ baseURL: `${base}/express` });

expressApi.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await getExpressToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const expressLogin = async (input: ExpressLoginInput): Promise<ExpressLoginResult> => {
  const res = await expressApi.post<ExpressLoginResult>("/auth/login", input);
  const data = res.data;
  if (data.token) {
    await setExpressToken(data.token);
    if (data.business_name) await setExpressBusinessName(data.business_name);
  }
  return data;
};

/** La cuenta queda "pending" tras registrarse: no devuelve token hasta completar el pago. */
export const expressRegister = async (input: ExpressRegisterInput): Promise<ExpressRegisterResult> => {
  const res = await expressApi.post<ExpressRegisterResult>("/auth/register", input);
  return res.data;
};

/** Verifica un pago de MercadoPago y, si está aprobado, activa la suscripción y auto-loguea. */
export const expressVerifyPayment = async (paymentId: string): Promise<ExpressVerifyResult> => {
  try {
    const res = await expressApi.post<ExpressVerifyResult>("/subscription/verify", { payment_id: paymentId });
    const data = res.data;
    if (data.token) {
      await setExpressToken(data.token);
      if (data.business_name) await setExpressBusinessName(data.business_name);
    }
    return { ...data, success: true };
  } catch (err) {
    const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
    return { success: false, message: message || "Error al verificar el pago." };
  }
};

export const getExpressMe = async (): Promise<ExpressMe> => {
  const res = await expressApi.get<ExpressMe>("/auth/me");
  return res.data;
};

export const expressLogout = async (): Promise<void> => {
  await removeExpressToken();
  await removeExpressBusinessName();
};
