import axios from "axios";

function normalize(url) {
  if (!url) return "";
  return url.replace(/\s+/g, "").replace(/\/+$/, "");
}

const envBase = normalize(import.meta.env.VITE_API_URL);
let baseURL = envBase
  ? (envBase.endsWith("/api") ? envBase : envBase + "/api")
  : (typeof window !== "undefined" ? window.location.origin + "/api" : "/api");

if (typeof window !== "undefined") {
  if (!/\/api$/.test(baseURL)) {
    console.warn("[axios] baseURL sin /api, corrigiendo:", baseURL);
  }
  console.info("[axios] baseURL:", baseURL);
}

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json"
  }
});

api.interceptors.response.use(
  r => r,
  e => {
    if (e?.response?.status === 404) {
      console.error("📌 404 recibido en:", e.config?.url);
    }
    return Promise.reject(e);
  }
);

export const loginRequest = (credentials) => api.post("/auth/login", credentials);
export const verifyTokenRequest = (token) =>
  api.get("/auth/verify", { headers: { Authorization: `Bearer ${token}` } });

export default api;
