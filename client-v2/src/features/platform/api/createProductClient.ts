import axios, { type AxiosInstance } from "axios";

const apiBase = (() => {
  const raw = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
  if (raw) return raw.endsWith("/api") ? raw : `${raw}/api`;
  if (typeof window !== "undefined") return `${window.location.origin}/api`;
  return "/api";
})();

/** Cliente axios con JWT de producto en localStorage (taxi, delivery, flotas, etc.). */
export function createProductClient(storageKey: string): {
  client: AxiosInstance;
  getToken: () => string | null;
  setToken: (token: string | null) => void;
} {
  const getToken = () => localStorage.getItem(storageKey);
  const setToken = (token: string | null) => {
    if (token) localStorage.setItem(storageKey, token);
    else localStorage.removeItem(storageKey);
  };

  const client = axios.create({
    baseURL: apiBase,
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
  });

  client.interceptors.request.use((config) => {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  return { client, getToken, setToken };
}

export { apiBase };
