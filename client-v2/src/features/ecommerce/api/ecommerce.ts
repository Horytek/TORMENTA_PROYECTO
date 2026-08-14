import api from "@/api/axios";
import type { BranchAvailability, StoreSucursal } from "../types/storefront";

const ecomTokenKey = "horytek_ecommerce_token";
const storefrontTokenPrefix = "horytek_storefront_token_";

export function getStorefrontToken(slug: string) {
  return localStorage.getItem(`${storefrontTokenPrefix}${slug}`);
}

export function setStorefrontToken(slug: string, token: string) {
  localStorage.setItem(`${storefrontTokenPrefix}${slug}`, token);
}

export function clearStorefrontToken(slug: string) {
  localStorage.removeItem(`${storefrontTokenPrefix}${slug}`);
}

function storefrontAuthHeaders(slug: string) {
  const token = getStorefrontToken(slug);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

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

export async function ecommerceUploadImagen(
  id: number,
  file: string,
  fileName: string,
  tipo: "galeria" | "informativa" = "galeria"
) {
  const { data } = await api.post(
    `/ecommerce/admin/productos/${id}/imagenes`,
    { file, fileName, tipo },
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

export async function ecommerceListOrdenes(params?: { id_sucursal?: number | null }) {
  const { data } = await api.get("/ecommerce/admin/ordenes", {
    headers: authHeaders(),
    params: params?.id_sucursal ? { id_sucursal: params.id_sucursal } : undefined,
  });
  return data;
}

export async function ecommerceDeleteOrdenes(ids: number[]) {
  const { data } = await api.post(
    "/ecommerce/admin/ordenes/eliminar",
    { ids },
    { headers: authHeaders() }
  );
  return data as { success: boolean; data: { deleted: number; ids: number[] } };
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

export type ResolveDisponibilidadResult = {
  modo: "inmediata" | "consultar" | "otra_ubicacion" | "agotado" | "incompleto";
  cta: "comprar" | "solicitar" | "no_disponible" | "incomplete";
  label: string;
  hint?: string | null;
  badge?: string;
  cantidad: number;
  fulfillment: string;
  id_sucursal?: number | null;
  id_sucursal_origen?: number | null;
  stock_local: number;
  disponibilidad?: {
    estado: string;
    label: string;
    hint?: string;
    cta?: {
      allowAddToCart?: boolean;
      requiresSolicitud?: boolean;
      showEnviarSolicitud?: boolean;
      showCart?: boolean;
      showWhatsapp?: boolean;
      primary?: string | null;
    };
  } | null;
};

export async function resolveProductDisponibilidad(
  slug: string,
  id: number,
  body: {
    id_variante?: number | null;
    cantidad?: number;
    fulfillment?: "pickup" | "delivery" | "provincia";
    id_sucursal?: number | null;
    id_zona?: number | null;
    distrito?: string | null;
    lat?: number | null;
    lng?: number | null;
  }
) {
  const { data } = await api.post(`/ecommerce/store/${slug}/products/${id}/disponibilidad/resolver`, body);
  return data as { success: boolean; data: ResolveDisponibilidadResult };
}

export async function validateCartStore(
  slug: string,
  body: {
    items: {
      id_producto: number;
      id_variante?: number | null;
      id_solicitud?: number | null;
      cantidad: number;
      selecciones?: { id_atributo: number; id_valor?: number | null; valor?: string }[];
      fulfillment?: string;
      id_sucursal?: number | null;
    }[];
    id_sucursal?: number | null;
    fulfillment?: "pickup" | "delivery" | "provincia";
    id_zona?: number | null;
  }
) {
  const { data } = await api.post(`/ecommerce/store/${slug}/cart/validate`, body, {
    headers: storefrontAuthHeaders(slug),
  });
  return data as {
    success: boolean;
    data: {
      ok: boolean;
      mixto?: boolean;
      aviso_mixto?: string | null;
      items: {
        id_producto: number;
        id_variante?: number | null;
        ok: boolean;
        estado: string;
        badge?: string;
        modo?: string;
        label?: string;
        disponible: number;
        cantidad: number;
        allowAddToCart?: boolean;
        requiresSolicitud?: boolean;
        message?: string | null;
      }[];
    };
  };
}

export async function checkoutStore(
  slug: string,
  body: {
    items: {
      id_producto: number;
      id_variante?: number | null;
      id_solicitud?: number | null;
      cantidad: number;
      selecciones?: { id_atributo: number; id_valor?: number | null; valor?: string }[];
    }[];
    id_sucursal?: number | null;
    fulfillment?: "pickup" | "delivery" | "provincia";
    telefono_comprador?: string;
    whatsapp_context?: Record<string, unknown>;
    id_zona?: number | null;
    id_destino?: number | null;
    id_agencia?: number | null;
    lat?: number | null;
    lng?: number | null;
    entrega?: {
      direccion?: string;
      referencia?: string;
      distrito?: string;
      receptor?: string;
      documento?: string;
      telefono?: string;
      notas?: string;
    } | null;
  }
) {
  const { data } = await api.post(`/ecommerce/store/${slug}/checkout`, body, {
    headers: storefrontAuthHeaders(slug),
  });
  return data;
}

// ——— Comprador (vitrina) ———

export async function buyerRegister(
  slug: string,
  body: { email: string; password: string; nombre: string; telefono?: string }
) {
  const { data } = await api.post(`/ecommerce/store/${slug}/auth/register`, body);
  return data;
}

export async function buyerLogin(slug: string, body: { email: string; password: string }) {
  const { data } = await api.post(`/ecommerce/store/${slug}/auth/login`, body);
  return data;
}

export async function buyerMe(slug: string) {
  const { data } = await api.get(`/ecommerce/store/${slug}/auth/me`, {
    headers: storefrontAuthHeaders(slug),
  });
  return data;
}

export async function buyerUpdateProfile(
  slug: string,
  body: { nombre: string; telefono?: string | null }
) {
  const { data } = await api.patch(`/ecommerce/store/${slug}/auth/me`, body, {
    headers: storefrontAuthHeaders(slug),
  });
  return data;
}

export async function buyerChangePassword(
  slug: string,
  body: { password_actual: string; password_nueva: string }
) {
  const { data } = await api.patch(`/ecommerce/store/${slug}/auth/me/password`, body, {
    headers: storefrontAuthHeaders(slug),
  });
  return data;
}

export async function buyerListFavoritos(slug: string) {
  const { data } = await api.get(`/ecommerce/store/${slug}/favoritos`, {
    headers: storefrontAuthHeaders(slug),
  });
  return data;
}

export async function buyerToggleFavorito(slug: string, id_producto: number) {
  const { data } = await api.post(`/ecommerce/store/${slug}/favoritos/${id_producto}`, null, {
    headers: storefrontAuthHeaders(slug),
  });
  return data;
}

export async function buyerListPedidos(slug: string, estado?: string) {
  const { data } = await api.get(`/ecommerce/store/${slug}/mis-pedidos`, {
    headers: storefrontAuthHeaders(slug),
    params: estado ? { estado_fulfillment: estado } : undefined,
  });
  return data;
}

export async function buyerGetPedido(slug: string, id_orden: number) {
  const { data } = await api.get(`/ecommerce/store/${slug}/mis-pedidos/${id_orden}`, {
    headers: storefrontAuthHeaders(slug),
  });
  return data;
}

// ——— Admin pickup ———

export async function pickupListOrdenes(params?: {
  q?: string;
  estado_fulfillment?: string;
  sucursal?: number;
  fulfillment?: string;
}) {
  const { data } = await api.get("/ecommerce/admin/pickup/ordenes", {
    headers: authHeaders(),
    params,
  });
  return data as {
    success: boolean;
    data: {
      ordenes: Record<string, unknown>[];
      kpis: {
        pendientes: number;
        preparando: number;
        listos: number;
        en_camino?: number;
        entregados_hoy: number;
      };
    };
  };
}

export async function pickupGetOrden(id: number) {
  const { data } = await api.get(`/ecommerce/admin/pickup/ordenes/${id}`, {
    headers: authHeaders(),
  });
  return data;
}

export async function pickupPatchEstado(
  id: number,
  body: { estado_fulfillment: string; notas?: string }
) {
  const { data } = await api.patch(`/ecommerce/admin/pickup/ordenes/${id}/estado`, body, {
    headers: authHeaders(),
  });
  return data;
}

export async function pickupValidar(body: {
  token?: string;
  codigo?: string;
  id_sucursal?: number | null;
}) {
  const { data } = await api.post("/ecommerce/admin/pickup/validar", body, {
    headers: authHeaders(),
  });
  return data;
}

export async function pickupConfirmarEntrega(
  id_orden: number,
  delivery_method?: "qr_scan" | "manual_code" | "admin_panel"
) {
  const { data } = await api.post(
    `/ecommerce/admin/pickup/confirmar-entrega/${id_orden}`,
    { delivery_method },
    { headers: authHeaders() }
  );
  return data;
}

export async function pickupDashboardKpis() {
  const { data } = await api.get("/ecommerce/admin/pickup/kpis", { headers: authHeaders() });
  return data;
}

// ——— Admin entregas ———

export async function adminGetEntregaConfig() {
  const { data } = await api.get("/ecommerce/admin/entregas/config", { headers: authHeaders() });
  return data;
}

export async function adminPatchEntregaConfig(body: Record<string, unknown>) {
  const { data } = await api.patch("/ecommerce/admin/entregas/config", body, {
    headers: authHeaders(),
  });
  return data;
}

export async function adminListZonas() {
  const { data } = await api.get("/ecommerce/admin/entregas/zonas", { headers: authHeaders() });
  return data;
}

export async function adminCreateZona(body: Record<string, unknown>) {
  const { data } = await api.post("/ecommerce/admin/entregas/zonas", body, {
    headers: authHeaders(),
  });
  return data;
}

export async function adminUpdateZona(id: number, body: Record<string, unknown>) {
  const { data } = await api.put(`/ecommerce/admin/entregas/zonas/${id}`, body, {
    headers: authHeaders(),
  });
  return data;
}

export async function adminDeleteZona(id: number) {
  const { data } = await api.delete(`/ecommerce/admin/entregas/zonas/${id}`, {
    headers: authHeaders(),
  });
  return data;
}

export async function adminListDestinos() {
  const { data } = await api.get("/ecommerce/admin/entregas/destinos", { headers: authHeaders() });
  return data;
}

export async function adminCreateDestino(body: Record<string, unknown>) {
  const { data } = await api.post("/ecommerce/admin/entregas/destinos", body, {
    headers: authHeaders(),
  });
  return data;
}

export async function adminUpdateDestino(id: number, body: Record<string, unknown>) {
  const { data } = await api.put(`/ecommerce/admin/entregas/destinos/${id}`, body, {
    headers: authHeaders(),
  });
  return data;
}

export async function adminDeleteDestino(id: number) {
  const { data } = await api.delete(`/ecommerce/admin/entregas/destinos/${id}`, {
    headers: authHeaders(),
  });
  return data;
}

export async function adminListAgencias() {
  const { data } = await api.get("/ecommerce/admin/entregas/agencias", { headers: authHeaders() });
  return data;
}

export async function adminCreateAgencia(body: Record<string, unknown>) {
  const { data } = await api.post("/ecommerce/admin/entregas/agencias", body, {
    headers: authHeaders(),
  });
  return data;
}

export async function adminUpdateAgencia(id: number, body: Record<string, unknown>) {
  const { data } = await api.put(`/ecommerce/admin/entregas/agencias/${id}`, body, {
    headers: authHeaders(),
  });
  return data;
}

export async function adminDeleteAgencia(id: number) {
  const { data } = await api.delete(`/ecommerce/admin/entregas/agencias/${id}`, {
    headers: authHeaders(),
  });
  return data;
}

export async function adminEntregaKpis() {
  const { data } = await api.get("/ecommerce/admin/entregas/kpis", { headers: authHeaders() });
  return data;
}

export async function storeEntregaOpciones(
  slug: string,
  params?: { subtotal?: number; id_sucursal?: number }
) {
  const { data } = await api.get(`/ecommerce/store/${slug}/entregas/opciones`, { params });
  return data;
}

export async function storeEntregaCotizar(
  slug: string,
  body: {
    fulfillment: "pickup" | "delivery" | "provincia";
    subtotal?: number;
    id_sucursal?: number | null;
    id_zona?: number | null;
    id_destino?: number | null;
    lat?: number | null;
    lng?: number | null;
  }
) {
  const { data } = await api.post(`/ecommerce/store/${slug}/entregas/cotizar`, body);
  return data;
}

// Admin multisucursal
export async function adminListSucursales(opts?: { incluirInactivas?: boolean }) {
  const { data } = await api.get("/ecommerce/admin/sucursales", {
    headers: authHeaders(),
    params: opts?.incluirInactivas ? { incluir_inactivas: 1 } : undefined,
  });
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

/* ——— Reseñas ——— */

export async function getProductReviews(
  slug: string,
  id_producto: number,
  params?: { sort?: string; page?: number; limit?: number }
) {
  const { data } = await api.get(`/ecommerce/store/${slug}/products/${id_producto}/reviews`, {
    params,
  });
  return data;
}

export async function getReviewSummary(
  slug: string,
  params: { tipo: string; id_producto?: number; id_sucursal?: number }
) {
  const { data } = await api.get(`/ecommerce/store/${slug}/reviews/summary`, { params });
  return data;
}

export async function getOpinionesGenerales(slug: string, limit = 20) {
  const { data } = await api.get(`/ecommerce/store/${slug}/opiniones`, { params: { limit } });
  return data;
}

export async function syncStoreOrderPayment(
  slug: string,
  codigo: string,
  params?: { payment_id?: string; collection_id?: string }
) {
  const { data } = await api.get(`/ecommerce/store/${slug}/ordenes/${codigo}/sync-pago`, {
    params,
  });
  return data;
}

export async function getReviewEligibilidad(
  slug: string,
  params: {
    tipo: string;
    id_producto?: number;
    id_orden?: number;
    id_sucursal?: number;
  }
) {
  const { data } = await api.get(`/ecommerce/store/${slug}/reviews/eligibilidad`, {
    params,
    headers: storefrontAuthHeaders(slug),
  });
  return data;
}

export async function createReview(slug: string, body: Record<string, unknown>) {
  const { data } = await api.post(`/ecommerce/store/${slug}/reviews`, body, {
    headers: storefrontAuthHeaders(slug),
  });
  return data;
}

export async function uploadReviewMedia(
  slug: string,
  body: { data_base64: string; file_name?: string }
) {
  const { data } = await api.post(`/ecommerce/store/${slug}/reviews/media`, body, {
    headers: storefrontAuthHeaders(slug),
  });
  return data;
}

export async function listMisReviews(slug: string) {
  const { data } = await api.get(`/ecommerce/store/${slug}/mis-reviews`, {
    headers: storefrontAuthHeaders(slug),
  });
  return data;
}

export async function adminGetReviewConfig() {
  const { data } = await api.get("/ecommerce/admin/reviews/config", { headers: authHeaders() });
  return data;
}

export async function adminPatchReviewConfig(body: Record<string, unknown>) {
  const { data } = await api.patch("/ecommerce/admin/reviews/config", body, {
    headers: authHeaders(),
  });
  return data;
}

export async function adminListReviews(params?: Record<string, string | number | undefined>) {
  const { data } = await api.get("/ecommerce/admin/reviews", {
    params,
    headers: authHeaders(),
  });
  return data;
}

export async function adminReviewStats() {
  const { data } = await api.get("/ecommerce/admin/reviews/stats", { headers: authHeaders() });
  return data;
}

export async function adminPatchReviewEstado(id: number, estado: string) {
  const { data } = await api.patch(
    `/ecommerce/admin/reviews/${id}/estado`,
    { estado },
    { headers: authHeaders() }
  );
  return data;
}

export async function adminReplyReview(id: number, cuerpo: string) {
  const { data } = await api.post(
    `/ecommerce/admin/reviews/${id}/reply`,
    { cuerpo },
    { headers: authHeaders() }
  );
  return data;
}

/* ——— Atributos / galería / stock / RBAC ——— */

export async function adminListAtributos(params?: { q?: string; tipo?: string; activo?: string }) {
  const { data } = await api.get("/ecommerce/admin/atributos", {
    headers: authHeaders(),
    params,
  });
  return data;
}

export async function adminGetAtributo(id: number) {
  const { data } = await api.get(`/ecommerce/admin/atributos/${id}`, { headers: authHeaders() });
  return data;
}

export async function adminCreateAtributo(body: Record<string, unknown>) {
  const { data } = await api.post("/ecommerce/admin/atributos", body, { headers: authHeaders() });
  return data;
}

export async function adminUpdateAtributo(id: number, body: Record<string, unknown>) {
  const { data } = await api.put(`/ecommerce/admin/atributos/${id}`, body, { headers: authHeaders() });
  return data;
}

export async function adminDeleteAtributo(id: number) {
  const { data } = await api.delete(`/ecommerce/admin/atributos/${id}`, { headers: authHeaders() });
  return data;
}

export async function adminAtributoProductos(id: number) {
  const { data } = await api.get(`/ecommerce/admin/atributos/${id}/productos`, {
    headers: authHeaders(),
  });
  return data;
}

export async function adminAddAtributoValor(id: number, body: { valor: string; hex?: string | null }) {
  const { data } = await api.post(`/ecommerce/admin/atributos/${id}/valores`, body, {
    headers: authHeaders(),
  });
  return data;
}

export async function adminUpdateAtributoValor(
  id: number,
  idValor: number,
  body: Record<string, unknown>
) {
  const { data } = await api.put(`/ecommerce/admin/atributos/${id}/valores/${idValor}`, body, {
    headers: authHeaders(),
  });
  return data;
}

export async function adminDeleteAtributoValor(id: number, idValor: number) {
  const { data } = await api.delete(`/ecommerce/admin/atributos/${id}/valores/${idValor}`, {
    headers: authHeaders(),
  });
  return data;
}

export async function adminGetProductoAtributos(id: number) {
  const { data } = await api.get(`/ecommerce/admin/productos/${id}/atributos`, {
    headers: authHeaders(),
  });
  return data;
}

export async function adminSetProductoAtributos(
  id: number,
  atributos: Record<string, unknown>[]
) {
  const { data } = await api.put(
    `/ecommerce/admin/productos/${id}/atributos`,
    { atributos },
    { headers: authHeaders() }
  );
  return data;
}

export async function adminListProductoImagenes(id: number, tipo?: "galeria" | "informativa") {
  const { data } = await api.get(`/ecommerce/admin/productos/${id}/imagenes`, {
    headers: authHeaders(),
    params: tipo ? { tipo } : undefined,
  });
  return data;
}

export async function adminSetImagenPrincipal(id: number, idImagen: number) {
  const { data } = await api.patch(
    `/ecommerce/admin/productos/${id}/imagenes/${idImagen}/principal`,
    {},
    { headers: authHeaders() }
  );
  return data;
}

export async function adminReorderImagenes(
  id: number,
  ids: number[],
  tipo: "galeria" | "informativa" = "galeria"
) {
  const { data } = await api.patch(
    `/ecommerce/admin/productos/${id}/imagenes/reorder`,
    { ids, tipo },
    { headers: authHeaders() }
  );
  return data;
}

export async function adminDeleteImagen(id: number, idImagen: number) {
  const { data } = await api.delete(`/ecommerce/admin/productos/${id}/imagenes/${idImagen}`, {
    headers: authHeaders(),
  });
  return data;
}

export async function adminListStock(params?: {
  q?: string;
  id_sucursal?: number | null;
  estado?: string;
  umbral?: number;
  limit?: number;
  offset?: number;
}) {
  const { data } = await api.get("/ecommerce/admin/stock", {
    headers: authHeaders(),
    params: {
      q: params?.q || undefined,
      id_sucursal: params?.id_sucursal || undefined,
      estado: params?.estado || undefined,
      umbral: params?.umbral,
      limit: params?.limit,
      offset: params?.offset,
    },
  });
  return data as {
    success: boolean;
    data: unknown[];
    total?: number;
    limit?: number;
    offset?: number;
  };
}

export async function adminListRoles() {
  const { data } = await api.get("/ecommerce/admin/roles", { headers: authHeaders() });
  return data;
}

export async function adminPatchRol(id: number, body: Record<string, unknown>) {
  const { data } = await api.patch(`/ecommerce/admin/roles/${id}`, body, { headers: authHeaders() });
  return data;
}

export async function adminListUsuarios() {
  const { data } = await api.get("/ecommerce/admin/usuarios", { headers: authHeaders() });
  return data;
}

export async function adminCreateUsuario(body: Record<string, unknown>) {
  const { data } = await api.post("/ecommerce/admin/usuarios", body, { headers: authHeaders() });
  return data;
}

export async function adminUpdateUsuario(id: number, body: Record<string, unknown>) {
  const { data } = await api.patch(`/ecommerce/admin/usuarios/${id}`, body, {
    headers: authHeaders(),
  });
  return data;
}

export type TaxonomiaTipo = "marca" | "categoria" | "tag";

export async function adminListTaxonomia(params?: {
  tipo?: TaxonomiaTipo;
  q?: string;
  activo?: string;
}) {
  const { data } = await api.get("/ecommerce/admin/taxonomia", {
    headers: authHeaders(),
    params,
  });
  return data;
}

export async function adminCreateTaxonomia(body: {
  tipo: TaxonomiaTipo;
  nombre: string;
  ensure?: boolean;
  activo?: boolean;
}) {
  const { data } = await api.post("/ecommerce/admin/taxonomia", body, { headers: authHeaders() });
  return data;
}

export async function adminUpdateTaxonomia(
  id: number,
  body: { nombre?: string; activo?: boolean; orden?: number }
) {
  const { data } = await api.put(`/ecommerce/admin/taxonomia/${id}`, body, {
    headers: authHeaders(),
  });
  return data;
}

export async function adminDeleteTaxonomia(id: number) {
  const { data } = await api.delete(`/ecommerce/admin/taxonomia/${id}`, { headers: authHeaders() });
  return data;
}

export async function registrarConsultaDisponibilidad(
  slug: string,
  body: {
    id_producto: number;
    id_variante?: number | null;
    id_sucursal?: number | null;
    cantidad?: number;
    attrs_snapshot?: { nombre: string; valor: string }[];
    origen?: string;
  }
) {
  const { data } = await api.post(`/ecommerce/store/${slug}/consultas-disponibilidad`, body);
  return data as { success: boolean; data?: { product_url?: string } };
}

export async function adminGetDisponibilidadConfig() {
  const { data } = await api.get("/ecommerce/admin/disponibilidad/config", { headers: authHeaders() });
  return data;
}

export async function adminPatchDisponibilidadConfig(body: Record<string, unknown>) {
  const { data } = await api.patch("/ecommerce/admin/disponibilidad/config", body, {
    headers: authHeaders(),
  });
  return data;
}

export async function adminDisponibilidadStats() {
  const { data } = await api.get("/ecommerce/admin/disponibilidad/stats", { headers: authHeaders() });
  return data;
}

export async function adminListReservasDisponibilidad() {
  const { data } = await api.get("/ecommerce/admin/disponibilidad/reservas", { headers: authHeaders() });
  return data;
}

export async function adminCrearReservaDisponibilidad(body: {
  id_producto: number;
  id_variante?: number | null;
  id_sucursal: number;
  cantidad?: number;
  minutos?: number;
  notas?: string;
}) {
  const { data } = await api.post("/ecommerce/admin/disponibilidad/reservas", body, {
    headers: authHeaders(),
  });
  return data;
}

export async function adminCancelarReservaDisponibilidad(id: number) {
  const { data } = await api.delete(`/ecommerce/admin/disponibilidad/reservas/${id}`, {
    headers: authHeaders(),
  });
  return data;
}

/* —— Solicitudes de disponibilidad —— */

export async function adminListSolicitudes(params?: {
  estado?: string | null;
  id_sucursal?: number | null;
  limit?: number;
}) {
  const { data } = await api.get("/ecommerce/admin/solicitudes", {
    headers: authHeaders(),
    params: {
      estado: params?.estado || undefined,
      id_sucursal: params?.id_sucursal || undefined,
      limit: params?.limit || 50,
    },
  });
  return data;
}

export async function adminStatsSolicitudes(id_sucursal?: number | null) {
  const { data } = await api.get("/ecommerce/admin/solicitudes/stats", {
    headers: authHeaders(),
    params: { id_sucursal: id_sucursal || undefined },
  });
  return data;
}

export async function adminGetSolicitud(id: number) {
  const { data } = await api.get(`/ecommerce/admin/solicitudes/${id}`, { headers: authHeaders() });
  return data;
}

export async function adminEnRevisionSolicitud(id: number) {
  const { data } = await api.post(`/ecommerce/admin/solicitudes/${id}/en-revision`, {}, {
    headers: authHeaders(),
  });
  return data;
}

export async function adminConfirmarSolicitud(
  id: number,
  body?: { id_sucursal_origen?: number | null; observacion_stock?: string }
) {
  const { data } = await api.post(`/ecommerce/admin/solicitudes/${id}/confirmar`, body || {}, {
    headers: authHeaders(),
  });
  return data;
}

export async function adminEnTrasladoSolicitud(
  id: number,
  body?: { id_sucursal_origen?: number | null }
) {
  const { data } = await api.post(`/ecommerce/admin/solicitudes/${id}/en-traslado`, body || {}, {
    headers: authHeaders(),
  });
  return data;
}

export async function adminAprobarSolicitud(id: number, body: Record<string, unknown>) {
  const { data } = await api.post(`/ecommerce/admin/solicitudes/${id}/aprobar`, body, {
    headers: authHeaders(),
  });
  return data;
}

export async function adminRechazarSolicitud(id: number, body: Record<string, unknown>) {
  const { data } = await api.post(`/ecommerce/admin/solicitudes/${id}/rechazar`, body, {
    headers: authHeaders(),
  });
  return data;
}

export async function adminCancelarSolicitud(id: number, body?: { motivo?: string }) {
  const { data } = await api.post(`/ecommerce/admin/solicitudes/${id}/cancelar`, body || {}, {
    headers: authHeaders(),
  });
  return data;
}

export async function buyerCrearSolicitud(
  slug: string,
  body: {
    id_producto: number;
    id_variante?: number | null;
    id_sucursal: number;
    cantidad?: number;
    attrs?: Record<string, unknown>;
    fulfillment?: "pickup" | "delivery" | "provincia";
    id_sucursal_origen?: number | null;
    id_zona?: number | null;
    direccion_entrega?: string | null;
    entrega_json?: Record<string, unknown> | null;
  }
) {
  const { data } = await api.post(`/ecommerce/store/${slug}/solicitudes`, body, {
    headers: storefrontAuthHeaders(slug),
  });
  return data as {
    success: boolean;
    duplicated?: boolean;
    message?: string;
    data?: Record<string, unknown>;
  };
}

export async function buyerListSolicitudes(slug: string) {
  const { data } = await api.get(`/ecommerce/store/${slug}/mis-solicitudes`, {
    headers: storefrontAuthHeaders(slug),
  });
  return data;
}

export async function buyerGetSolicitud(slug: string, id: number) {
  const { data } = await api.get(`/ecommerce/store/${slug}/mis-solicitudes/${id}`, {
    headers: storefrontAuthHeaders(slug),
  });
  return data;
}

export async function buyerCancelarSolicitud(slug: string, id: number, motivo?: string) {
  const { data } = await api.post(
    `/ecommerce/store/${slug}/mis-solicitudes/${id}/cancelar`,
    { motivo },
    { headers: storefrontAuthHeaders(slug) }
  );
  return data;
}

export async function buyerComprarDesdeSolicitud(slug: string, id: number) {
  const { data } = await api.post(
    `/ecommerce/store/${slug}/mis-solicitudes/${id}/comprar`,
    {},
    { headers: storefrontAuthHeaders(slug) }
  );
  return data as {
    success: boolean;
    data?: {
      id_solicitud: number;
      id_producto: number;
      id_variante?: number | null;
      id_sucursal: number;
      cantidad: number;
      attrs?: Record<string, unknown>;
      precio?: number;
      producto_nombre?: string;
      expires_at?: string;
    };
  };
}

export type BuyerNotificacion = {
  id_notificacion: number;
  tipo: string;
  titulo: string;
  cuerpo?: string | null;
  ref_tipo: string;
  ref_id: number;
  payload?: {
    codigo?: string | null;
    estado?: string;
    id_producto?: number | null;
    expires_at?: string | null;
    producto_nombre?: string | null;
  } | null;
  leida: boolean;
  leida_at?: string | null;
  created_at?: string;
};

export async function buyerListNotificaciones(slug: string) {
  const { data } = await api.get(`/ecommerce/store/${slug}/mis-notificaciones`, {
    headers: storefrontAuthHeaders(slug),
  });
  return data as { success: boolean; data: BuyerNotificacion[] };
}

export async function buyerUnreadNotificaciones(slug: string) {
  const { data } = await api.get(`/ecommerce/store/${slug}/mis-notificaciones/unread-count`, {
    headers: storefrontAuthHeaders(slug),
  });
  return data as { success: boolean; data: { count: number } };
}

export async function buyerLeerNotificacion(slug: string, id: number) {
  const { data } = await api.post(
    `/ecommerce/store/${slug}/mis-notificaciones/${id}/leer`,
    {},
    { headers: storefrontAuthHeaders(slug) }
  );
  return data;
}

export async function buyerLeerTodasNotificaciones(slug: string) {
  const { data } = await api.post(
    `/ecommerce/store/${slug}/mis-notificaciones/leer-todas`,
    {},
    { headers: storefrontAuthHeaders(slug) }
  );
  return data;
}

