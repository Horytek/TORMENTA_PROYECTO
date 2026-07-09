import axios from "axios";
import type { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
import { getToken } from "../utils/authStorage";

let authReady = false;
let waiters: (() => void)[] = [];

export function setAuthReady(value = true): void {
  authReady = value;
  if (authReady) {
    waiters.forEach((r) => r());
    waiters = [];
  }
}

// Esperar brevemente si aún no está listo auth (rehidratación de estado)
function waitForAuth(): Promise<void> {
  if (authReady) return Promise.resolve();
  return new Promise<void>((res) => {
    waiters.push(res);
    setTimeout(res, 300); // timeout de seguridad
  });
}

const base = (() => {
  const raw = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
  if (raw) return raw.endsWith("/api") ? raw : `${raw}/api`;
  if (typeof window !== "undefined") return `${window.location.origin}/api`;
  return "/api";
})();

const api = axios.create({
  baseURL: base,
  withCredentials: true, // Importante para cookies HTTPOnly y sesiones
  headers: { "Content-Type": "application/json" }
});

// Interceptor de Peticiones: inyectar Token de IndexedDB
api.interceptors.request.use(
  async (cfg: InternalAxiosRequestConfig) => {
    await waitForAuth();

    const token = await getToken();
    if (token) {
      cfg.headers.Authorization = `Bearer ${token}`;
    }

    return cfg;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Interceptor de Respuestas: Control Global de Errores
api.interceptors.response.use(
  (r: AxiosResponse) => r,
  (e: AxiosError<any>) => {
    // Manejo de expiración de suscripción (SaaS Multi-tenant)
    if (e?.response?.status === 402 && e?.response?.data?.code === 'SUBSCRIPTION_EXPIRED') {
      if (typeof window !== "undefined" && !window.location.pathname.includes('/express/subscription')) {
        window.location.href = "/express/subscription";
      }
    }

    if (e?.response?.status === 401) {
      console.warn("[auth] 401:", e.config?.url);
    }
    return Promise.reject(e);
  }
);

export default api;
