import axios from "axios";
import api from "@/api/axios";

const base = (() => {
  const raw = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
  if (raw) return raw.endsWith("/api") ? raw : `${raw}/api`;
  if (typeof window !== "undefined") return `${window.location.origin}/api`;
  return "/api";
})();

const mayoristaClient = axios.create({
  baseURL: base,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export function setMayoristaToken(token: string | null) {
  if (token) {
    localStorage.setItem("horytek_mayorista_token", token);
  } else {
    localStorage.removeItem("horytek_mayorista_token");
  }
}

export function getMayoristaToken() {
  return localStorage.getItem("horytek_mayorista_token");
}

mayoristaClient.interceptors.request.use((config) => {
  const token = getMayoristaToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* Admin (JWT ERP vía axios principal) */
export async function listMayoristaTiendas() {
  const { data } = await api.get("/mayorista/admin/tiendas");
  return data;
}

export async function createMayoristaTienda(body: {
  slug: string;
  nombre: string;
  whatsapp?: string;
}) {
  const { data } = await api.post("/mayorista/admin/tiendas", body);
  return data;
}

export async function listMayoristaListas() {
  const { data } = await api.get("/mayorista/admin/listas");
  return data;
}

export async function createMayoristaLista(body: { id_tienda: number; nombre: string }) {
  const { data } = await api.post("/mayorista/admin/listas", body);
  return data;
}

export async function addMayoristaItem(body: {
  id_lista: number;
  sku: string;
  nombre: string;
  precio: number;
  min_cantidad?: number;
}) {
  const { data } = await api.post("/mayorista/admin/items", body);
  return data;
}

export async function listMayoristaItems(id_lista: number) {
  const { data } = await api.get(`/mayorista/admin/listas/${id_lista}/items`);
  return data;
}

export async function createMayoristaComprador(body: {
  id_tienda: number;
  email: string;
  password: string;
  razon_social: string;
  ruc?: string;
  id_lista?: number;
}) {
  const { data } = await api.post("/mayorista/admin/compradores", body);
  return data;
}

export async function listMayoristaCompradores() {
  const { data } = await api.get("/mayorista/admin/compradores");
  return data;
}

export async function listMayoristaPedidos() {
  const { data } = await api.get("/mayorista/admin/pedidos");
  return data;
}

export async function updateMayoristaPedidoEstado(id_pedido: number, estado: string) {
  const { data } = await api.patch(`/mayorista/admin/pedidos/${id_pedido}`, { estado });
  return data;
}

/* Portal B2B — cliente sin JWT ERP (evita interferir con sesión ERP) */
export async function getMayoristaPortal(slug: string) {
  const { data } = await mayoristaClient.get(`/mayorista/portal/${slug}`);
  return data;
}

export async function loginMayorista(body: { slug: string; email: string; password: string }) {
  const { data } = await mayoristaClient.post("/mayorista/auth/login", body);
  return data;
}

export async function getMayoristaCatalogo() {
  const { data } = await mayoristaClient.get("/mayorista/me/catalogo");
  return data;
}

export async function createMayoristaPedido(body: {
  notas?: string;
  items: { sku: string; cantidad: number }[];
}) {
  const { data } = await mayoristaClient.post("/mayorista/me/pedidos", body);
  return data;
}

export async function listMisPedidosMayorista() {
  const { data } = await mayoristaClient.get("/mayorista/me/pedidos");
  return data;
}
