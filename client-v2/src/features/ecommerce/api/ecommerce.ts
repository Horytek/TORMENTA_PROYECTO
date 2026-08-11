import api from "@/api/axios";
import type { BranchAvailability, StoreSucursal } from "../types/storefront";

const ecomTokenKey = "horytek_ecommerce_token";

export function getEcommerceToken() {
  return localStorage.getItem(ecomTokenKey);
}

export function setEcommerceToken(token: string) {
  localStorage.setItem(ecomTokenKey, token);
}

export function clearEcommerceToken() {
  localStorage.removeItem(ecomTokenKey);
}

function authHeaders() {
  const token = getEcommerceToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function registerEcommerce(body: {
  nombre: string;
  slug: string;
  email: string;
  telefono?: string;
  plan: "starter" | "pro";
}) {
  const { data } = await api.post("/ecommerce/register", body);
  return data;
}

export async function createEcommercePreference(body: {
  id_tienda: number;
  plan: "starter" | "pro";
}) {
  const { data } = await api.post("/ecommerce/create-preference", body);
  return data;
}

export async function loginEcommerce(usuario: string, password: string) {
  const { data } = await api.post("/ecommerce/auth/login", { usuario, password });
  return data;
}

export async function ecommerceMe() {
  const { data } = await api.get("/ecommerce/admin/me", { headers: authHeaders() });
  return data;
}

export async function ecommerceDashboard() {
  const { data } = await api.get("/ecommerce/admin/dashboard", { headers: authHeaders() });
  return data;
}

export async function ecommerceListProductos() {
  const { data } = await api.get("/ecommerce/admin/productos", { headers: authHeaders() });
  return data;
}

export async function ecommerceCreateProducto(body: Record<string, unknown>) {
  const { data } = await api.post("/ecommerce/admin/productos", body, { headers: authHeaders() });
  return data;
}

export async function ecommerceUpdateProducto(id: number, body: Record<string, unknown>) {
  const { data } = await api.put(`/ecommerce/admin/productos/${id}`, body, { headers: authHeaders() });
  return data;
}

export async function ecommerceDeleteProducto(id: number) {
  const { data } = await api.delete(`/ecommerce/admin/productos/${id}`, { headers: authHeaders() });
  return data;
}

export async function ecommerceUploadImagen(id: number, file: string, fileName: string) {
  const { data } = await api.post(
    `/ecommerce/admin/productos/${id}/imagenes`,
    { file, fileName },
    { headers: authHeaders() }
  );
  return data;
}

export async function ecommerceSaveMpCredentials(body: {
  public_key: string;
  access_token: string;
  modo: "test" | "prod";
}) {
  const { data } = await api.put("/ecommerce/admin/mp-credentials", body, { headers: authHeaders() });
  return data;
}

export async function ecommerceUpdateTienda(body: Record<string, unknown>) {
  const { data } = await api.patch("/ecommerce/admin/tienda", body, { headers: authHeaders() });
  return data;
}

export async function ecommerceUploadLogo(file: string, fileName?: string) {
  const { data } = await api.post(
    "/ecommerce/admin/tienda/logo",
    { file, fileName },
    { headers: authHeaders() }
  );
  return data;
}

export async function ecommerceUploadBanner(file: string, fileName?: string) {
  const { data } = await api.post(
    "/ecommerce/admin/tienda/banner",
    { file, fileName },
    { headers: authHeaders() }
  );
  return data;
}

export async function ecommerceListOrdenes() {
  const { data } = await api.get("/ecommerce/admin/ordenes", { headers: authHeaders() });
  return data;
}

export async function getStore(slug: string, branch?: number | null) {
  const params = branch ? { branch } : undefined;
  const { data } = await api.get(`/ecommerce/store/${slug}`, { params });
  return data;
}

export async function getStoreSucursales(slug: string) {
  const { data } = await api.get(`/ecommerce/store/${slug}/sucursales`);
  return data as { success: boolean; data: StoreSucursal[] };
}

export async function searchStore(slug: string, q: string, branch?: number | null) {
  const { data } = await api.get(`/ecommerce/store/${slug}/search`, {
    params: { q, branch: branch || undefined },
  });
  return data as {
    success: boolean;
    data: { productos: Record<string, unknown>[]; categorias: string[] };
  };
}

export async function getStoreProduct(slug: string, id: number, branch?: number | null) {
  const params = branch ? { branch } : undefined;
  const { data } = await api.get(`/ecommerce/store/${slug}/products/${id}`, { params });
  return data;
}

export async function getProductAvailability(slug: string, id: number) {
  const { data } = await api.get(`/ecommerce/store/${slug}/products/${id}/disponibilidad`);
  return data as { success: boolean; data: BranchAvailability[] };
}

export async function checkoutStore(
  slug: string,
  body: {
    items: { id_producto: number; id_variante?: number | null; cantidad: number }[];
    id_sucursal: number;
    fulfillment?: "pickup";
    email_comprador: string;
    nombre_comprador?: string;
    telefono_comprador?: string;
    whatsapp_context?: Record<string, unknown>;
  }
) {
  const { data } = await api.post(`/ecommerce/store/${slug}/checkout`, body);
  return data;
}

// Admin multisucursal
export async function adminListSucursales() {
  const { data } = await api.get("/ecommerce/admin/sucursales", { headers: authHeaders() });
  return data;
}

export async function adminCreateSucursal(body: Record<string, unknown>) {
  const { data } = await api.post("/ecommerce/admin/sucursales", body, { headers: authHeaders() });
  return data;
}

export async function adminUpdateSucursal(id: number, body: Record<string, unknown>) {
  const { data } = await api.put(`/ecommerce/admin/sucursales/${id}`, body, { headers: authHeaders() });
  return data;
}

export async function adminDeleteSucursal(id: number) {
  const { data } = await api.delete(`/ecommerce/admin/sucursales/${id}`, { headers: authHeaders() });
  return data;
}

export async function adminInventarioResumen() {
  const { data } = await api.get("/ecommerce/admin/inventario/resumen", { headers: authHeaders() });
  return data;
}

export async function adminInventarioMatriz(opts?: {
  sucursal?: number;
  limit?: number;
  offset?: number;
  q?: string;
}) {
  const { data } = await api.get("/ecommerce/admin/inventario/matriz", {
    headers: authHeaders(),
    params: {
      sucursal: opts?.sucursal,
      limit: opts?.limit,
      offset: opts?.offset,
      q: opts?.q || undefined,
    },
  });
  return data as {
    success: boolean;
    data: Record<string, unknown>[];
    total: number;
    limit: number;
    offset: number;
  };
}

export async function adminAjustarInventario(body: {
  id_variante: number;
  id_sucursal: number;
  delta: number;
  motivo?: string;
}) {
  const { data } = await api.post("/ecommerce/admin/inventario/ajuste", body, { headers: authHeaders() });
  return data;
}

export async function adminListMovimientos(limit = 50) {
  const { data } = await api.get("/ecommerce/admin/inventario/movimientos", {
    headers: authHeaders(),
    params: { limit },
  });
  return data;
}

export async function adminListTransferencias() {
  const { data } = await api.get("/ecommerce/admin/transferencias", { headers: authHeaders() });
  return data;
}

export async function adminSearchVariantes(q: string) {
  const { data } = await api.get("/ecommerce/admin/variantes/search", {
    headers: authHeaders(),
    params: { q },
  });
  return data as {
    success: boolean;
    data: {
      id_variante: number;
      id_producto: number;
      producto_nombre: string;
      producto_sku: string | null;
      variante_sku: string | null;
      talla: string | null;
      color: string | null;
    }[];
  };
}

export async function adminCreateTransferencia(body: Record<string, unknown>) {
  const { data } = await api.post("/ecommerce/admin/transferencias", body, { headers: authHeaders() });
  return data;
}

export async function adminUpdateTransferenciaEstado(id: number, estado: string) {
  const { data } = await api.patch(
    `/ecommerce/admin/transferencias/${id}/estado`,
    { estado },
    { headers: authHeaders() }
  );
  return data;
}
