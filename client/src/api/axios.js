import axios from "axios";

let authReady = false;
let waiters = [];

export function setAuthReady(value = true) {
  authReady = value;
  if (authReady) {
    waiters.forEach(r => r());
    waiters = [];
  }
}

const base = (() => {
  const raw = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
  if (raw) return raw.endsWith("/api") ? raw : raw + "/api";
  if (typeof window !== "undefined") return window.location.origin + "/api";
  return "/api";
})();

const api = axios.create({
  baseURL: base,
  withCredentials: true, // Importante para cookies HTTPOnly
  headers: { "Content-Type": "application/json" }
});

// Esperar breve si aún no está listo auth (rehidratación)
function waitForAuth() {
  if (authReady) return Promise.resolve();
  return new Promise(res => {
    waiters.push(res);
    setTimeout(res, 300); // timeout de seguridad
  });
}

import { getToken } from "../utils/authStorage";

// Token en header usando IndexedDB (más seguro que localStorage)
api.interceptors.request.use(async cfg => {
  await waitForAuth();

  const token = await getToken();
  if (token) {
    cfg.headers.Authorization = `Bearer ${token}`;
  }

  return cfg;
});

api.interceptors.response.use(
  r => r,
  e => {
    if (e?.response?.status === 401) {
      console.warn("[auth] 401:", e.config?.url);
    }
    return Promise.reject(e);
  }
);

export default api;

// Helpers ya usados
export const loginRequest = (credentials) => api.post("/auth/login", credentials);
// Nota: la verificación se expone desde api.auth.js con caché de promesa
