import axios from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import {
  getExpressToken, setExpressToken, setExpressBusinessName, removeExpressToken, removeExpressBusinessName,
  setExpressRole, removeExpressRole, setExpressPermissions, removeExpressPermissions,
} from "@/utils/expressStorage";
import type {
  ExpressLoginInput, ExpressLoginResult, ExpressRegisterInput, ExpressRegisterResult, ExpressMe, ExpressVerifyResult,
  ExpressProduct, ExpressProductInput, ExpressSalePayload, ExpressSaleSummary, ExpressSaleDetail,
  ExpressDashboardStats, ExpressUser, ExpressUserInput, ExpressPlan, ExpressSubscriptionStatus,
  ExpressNotificationsResult,
} from "../types";

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
  const data = res.data;
  await setExpressRole(data.role);
  await setExpressPermissions(data.permissions);
  return data;
};

export const expressLogout = async (): Promise<void> => {
  await removeExpressToken();
  await removeExpressBusinessName();
  await removeExpressRole();
  await removeExpressPermissions();
};

export const updateExpressPasswordRequest = async (password: string): Promise<{ message: string }> => {
  const res = await expressApi.post("/auth/update-password", { password });
  return res.data;
};

// ── Productos ────────────────────────────────────────────────────
export const getExpressProducts = async (): Promise<ExpressProduct[]> => {
  const res = await expressApi.get<ExpressProduct[]>("/products");
  return res.data;
};

export const createExpressProduct = async (input: ExpressProductInput): Promise<{ message: string }> => {
  const res = await expressApi.post("/products", input);
  return res.data;
};

export const updateExpressProduct = async (id: number, input: ExpressProductInput): Promise<{ message: string }> => {
  const res = await expressApi.put(`/products/${id}`, input);
  return res.data;
};

export const deleteExpressProduct = async (id: number): Promise<{ message: string }> => {
  const res = await expressApi.delete(`/products/${id}`);
  return res.data;
};

// ── Ventas ───────────────────────────────────────────────────────
export const createExpressSale = async (payload: ExpressSalePayload): Promise<{ message: string; saleId: number }> => {
  const res = await expressApi.post("/sales", payload);
  return res.data;
};

export const getExpressSales = async (): Promise<ExpressSaleSummary[]> => {
  const res = await expressApi.get<ExpressSaleSummary[]>("/sales");
  return res.data;
};

export const getExpressSaleDetails = async (id: number): Promise<ExpressSaleDetail> => {
  const res = await expressApi.get<ExpressSaleDetail>(`/sales/${id}`);
  return res.data;
};

// ── Dashboard ────────────────────────────────────────────────────
export const getExpressDashboardStats = async (): Promise<ExpressDashboardStats> => {
  const res = await expressApi.get<ExpressDashboardStats>("/dashboard");
  return res.data;
};

// ── Usuarios (empleados) ─────────────────────────────────────────
export const getExpressUsers = async (): Promise<ExpressUser[]> => {
  const res = await expressApi.get<ExpressUser[]>("/users");
  return res.data.map((u) => ({
    ...u,
    permissions: typeof u.permissions === "string" ? JSON.parse(u.permissions) : u.permissions,
  }));
};

export const createExpressUser = async (input: ExpressUserInput): Promise<{ message: string }> => {
  const res = await expressApi.post("/users", { ...input, role: input.role || "cashier" });
  return res.data;
};

export const updateExpressUser = async (id: number, input: ExpressUserInput): Promise<{ message: string }> => {
  const res = await expressApi.put(`/users/${id}`, input);
  return res.data;
};

export const deleteExpressUser = async (id: number): Promise<{ message: string }> => {
  const res = await expressApi.delete(`/users/${id}`);
  return res.data;
};

// ── Suscripción ──────────────────────────────────────────────────
export const getExpressPlans = async (): Promise<ExpressPlan[]> => {
  const res = await expressApi.get<ExpressPlan[]>("/subscription/plans");
  return res.data;
};

export const getExpressSubscriptionStatus = async (): Promise<ExpressSubscriptionStatus> => {
  const res = await expressApi.get<ExpressSubscriptionStatus>("/subscription/status");
  return res.data;
};

export const subscribeToExpressPlan = async (plan_id: number): Promise<{ message: string; init_point?: string }> => {
  const res = await expressApi.post("/subscription/subscribe", { plan_id });
  return res.data;
};

export const renewExpressSubscription = async (plan_id: number): Promise<{ init_point?: string }> => {
  const res = await expressApi.post("/subscription/renew", { plan_id });
  return res.data;
};

// ── Notificaciones ───────────────────────────────────────────────
export const getExpressNotifications = async (): Promise<ExpressNotificationsResult> => {
  const res = await expressApi.get<ExpressNotificationsResult>("/notifications");
  return res.data;
};

export const markExpressNotificationsRead = async (id: number | "all" = "all"): Promise<{ message: string }> => {
  const res = await expressApi.put(`/notifications/${id}/read`);
  return res.data;
};
