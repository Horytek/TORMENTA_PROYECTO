import api from "@/api/axios";

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

export async function getStore(slug: string) {
  const { data } = await api.get(`/ecommerce/store/${slug}`);
  return data;
}

export async function getStoreProduct(slug: string, id: number) {
  const { data } = await api.get(`/ecommerce/store/${slug}/products/${id}`);
  return data;
}

export async function checkoutStore(
  slug: string,
  body: {
    items: { id_producto: number; cantidad: number }[];
    email_comprador: string;
    nombre_comprador?: string;
    telefono_comprador?: string;
  }
) {
  const { data } = await api.post(`/ecommerce/store/${slug}/checkout`, body);
  return data;
}
