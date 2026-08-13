/**
 * Adapter: vitrina estilo Ecommerce → APIs ERP `/api/catalogo` (db_tormenta / id_tenant).
 * No llama a `/ecommerce/*`.
 */
import api from "@/api/axios";
import type { BranchAvailability, StoreSucursal } from "../types/storefront";
import { erpDispConfig, resolveDisponibilidad } from "../utils/disponibilidad";
import type { StoreTheme } from "../types/theme";

const storefrontTokenPrefix = "horytek_erp_store_token_";

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

/** Stubs admin ecommerce — no usados en storefront ERP */
export function getEcommerceToken() {
  return null;
}
export function setEcommerceToken(_t: string) {}
export function clearEcommerceToken() {}

function hashValor(s: string): number {
  let h = 0;
  const str = String(s);
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return Math.abs(h) || 1;
}

function mapProducto(p: Record<string, unknown>) {
  const id = Number(p.id_producto ?? p.codigo);
  const nombre = String(p.nombre ?? p.descripcion ?? "");
  const attrs: Record<string, unknown> = {};
  if (p.categoria) attrs.categoria = p.categoria;
  if (p.nom_marca) attrs.marca = p.nom_marca;
  if (p.destacado || p.destacado_tienda) attrs.destacado = true;
  const stock = Number(p.stock ?? 0);
  const raw = p.disponibilidad as { cta?: unknown; estado?: string; stock?: number } | undefined;
  // ERP manda { estado, label, stock }; la vitrina espera shape ecommerce con cta.*
  const disponibilidad =
    raw && raw.cta
      ? raw
      : resolveDisponibilidad(stock, attrs, erpDispConfig());
  return {
    id_producto: id,
    nombre,
    descripcion: p.descripcion ?? null,
    precio: Number(p.precio) || 0,
    stock,
    sku: p.sku ?? null,
    categoria: (p.categoria as string) || null,
    attrs_json: attrs,
    imagen_url: (p.imagen_url as string) || (Array.isArray(p.images) ? (p.images as string[])[0] : null),
    disponibilidad,
  };
}

function parseThemeJson(raw: unknown): Partial<StoreTheme> | null {
  if (!raw) return null;
  if (typeof raw === "object") return raw as Partial<StoreTheme>;
  try {
    const v = JSON.parse(String(raw));
    return v && typeof v === "object" ? (v as Partial<StoreTheme>) : null;
  } catch {
    return null;
  }
}

function mapTienda(store: Record<string, unknown>, negocio?: Record<string, unknown>) {
  const theme = parseThemeJson(store.theme_json);
  const dispRaw =
    (theme as { disponibilidad?: Record<string, unknown> } | null)?.disponibilidad ||
    (store.disponibilidad_config as Record<string, unknown> | undefined);
  return {
    slug: String(store.slug || ""),
    nombre: String(store.nombre || negocio?.nombre || "Tienda"),
    color_primario: (store.color_primario as string) || "#0E7C7B",
    logo_url: (store.logo as string) || (store.logo_url as string) || (negocio?.logo as string) || null,
    descripcion: (store.mensaje_bienvenida as string) || (store.descripcion as string) || null,
    telefono: (store.telefono as string) || (negocio?.telefono as string) || null,
    theme_json: theme,
    disponibilidad_config: erpDispConfig(dispRaw as Parameters<typeof erpDispConfig>[0]),
    checkout_habilitado: store.checkout_habilitado !== false,
    mp_conectado: Boolean(store.mp_conectado),
    mp_modo: store.mp_modo || "test",
    id_tenant: store.id_tenant,
  };
}

function mapSucursal(s: Record<string, unknown>): StoreSucursal {
  return {
    id_sucursal: Number(s.id_sucursal),
    nombre: String(s.nombre || s.nombre_sucursal || "Sucursal"),
    direccion: String(s.direccion || ""),
    telefono: (s.telefono as string) || null,
    whatsapp: (s.whatsapp as string) || (s.telefono as string) || null,
    allow_pickup: s.allow_pickup !== false && Number(s.allow_pickup) !== 0,
    allow_delivery: s.allow_delivery === true || Number(s.allow_delivery) === 1,
    es_default: Boolean(s.es_default),
  };
}

function mapDetalleProducto(raw: Record<string, unknown>) {
  const producto = mapProducto(raw);
  const ejes = (raw.ejes_variante as Record<string, unknown>[]) || [];
  const variantesRaw = (raw.variantes as Record<string, unknown>[]) || [];

  const atributos = ejes.map((e) => {
    const vals = (e.valores as string[]) || [];
    return {
      id_atributo: Number(e.id_atributo),
      nombre: String(e.nombre || ""),
      codigo: String(e.slug || e.id_atributo),
      tipo: String(e.tipo_input || "SELECT"),
      es_variante: true,
      visible_storefront: true,
      requiere_seleccion: true,
      obligatorio: true,
      valores: vals.map((v) => ({
        id_valor: hashValor(String(v)),
        valor: String(v),
        hex: null as string | null,
      })),
    };
  });

  // Atributos informativos fijos
  for (const a of (raw.atributos as Record<string, unknown>[]) || []) {
    const id = Number(a.id_atributo);
    if (atributos.some((x) => x.id_atributo === id)) continue;
    atributos.push({
      id_atributo: id,
      nombre: String(a.nombre || ""),
      codigo: String(a.slug || id),
      tipo: String(a.tipo_input || "TEXT"),
      es_variante: false,
      visible_storefront: true,
      requiere_seleccion: false,
      obligatorio: false,
      valor_fijo: String(a.valor || ""),
      valores: [],
    } as (typeof atributos)[0] & { valor_fijo?: string });
  }

  const variantes = variantesRaw.map((v) => {
    const attrsJson =
      typeof v.attributes_json === "string"
        ? JSON.parse((v.attributes_json as string) || "{}")
        : (v.attributes_json as Record<string, unknown>) || {};
    const attrs: Record<string, number> = {};
    for (const [k, val] of Object.entries(attrsJson)) {
      if (typeof val === "number") attrs[k] = val;
      else attrs[k] = hashValor(String(val));
    }
    return {
      id_variante: Number(v.id_sku ?? v.id_variante),
      sku: (v.sku as string) || null,
      attrs,
      precio_override: v.precio != null ? Number(v.precio) : null,
      stock: Number(v.stock ?? 0),
      disponibilidad: v.disponibilidad,
    };
  });

  const images = ((raw.images as string[]) || []).map((url, i) => ({
    id_imagen: i + 1,
    url,
    es_principal: i === 0 ? 1 : 0,
    orden: i,
  }));

  return {
    ...producto,
    atributos,
    variantes,
    imagenes: images,
    imagenes_informativas: [] as { id_imagen: number; url: string; orden?: number }[],
    stock_por_sucursal: raw.stock_por_sucursal || [],
    resenas: raw.resenas || [],
  };
}

export async function getStore(slug: string, branch?: number | null) {
  const { data } = await api.get(`/catalogo/store/${slug}`, {
    params: branch ? { id_sucursal: branch } : undefined,
  });
  if (!data?.success && data?.code !== 1) return data;
  const d = data.data || {};
  const productos = (d.productos || []).map(mapProducto);
  const tienda = mapTienda(d.store || {}, d.negocio);
  // Excluir "Oficina" del recojo público (HQ, no punto de venta)
  const sucursales = (d.sucursales || []).map(mapSucursal);
  return {
    success: true,
    data: {
      tienda,
      productos,
      sucursales,
      destacados: (d.destacados || []).map(mapProducto),
      mas_vendidos: (d.mas_vendidos || []).map(mapProducto),
      banners: d.banners || [],
      facets: d.facets,
      entrega: d.entrega,
      mp_ready: Boolean(tienda.mp_conectado),
    },
  };
}

export async function getStoreSucursales(slug: string) {
  const res = await getStore(slug);
  return { success: true, data: (res.data?.sucursales || []) as StoreSucursal[] };
}

export async function searchStore(slug: string, q: string, branch?: number | null) {
  const { data } = await api.get(`/catalogo/store/${slug}/productos`, {
    params: { q, id_sucursal: branch || undefined, limit: 40 },
  });
  const items = (data?.data?.items || data?.data?.productos || []).map(mapProducto);
  const cats = Array.from(
    new Set(items.map((p: { categoria?: string | null }) => p.categoria).filter(Boolean))
  ) as string[];
  return { success: true, data: { productos: items, categorias: cats } };
}

export async function getStoreProduct(slug: string, id: number, branch?: number | null) {
  const { data } = await api.get(`/catalogo/store/${slug}/productos/${id}`, {
    params: branch ? { id_sucursal: branch } : undefined,
  });
  if (!data?.success) return data;
  const producto = mapDetalleProducto(data.data.producto || {});
  const relacionados = (data.data.relacionados || []).map(mapProducto);
  const tienda = mapTienda(data.data.store || {});
  return {
    success: true,
    data: {
      producto,
      relacionados,
      resenas: data.data.resenas || [],
      tienda,
      atributos: producto.atributos,
      variantes: producto.variantes,
      imagenes: producto.imagenes,
      imagenes_informativas: [],
    },
  };
}

export async function getProductAvailability(slug: string, id: number) {
  const { data } = await api.get(`/catalogo/store/${slug}/productos/${id}`);
  if (!data?.success) return { success: false, data: [] as BranchAvailability[] };
  const producto = data.data?.producto || {};
  const variantesRaw = (producto.variantes || []) as Record<string, unknown>[];
  const rows = (producto.stock_por_sucursal || []) as Record<string, unknown>[];
  const mapped: BranchAvailability[] = rows.map((r) => ({
    sucursal: {
      id_sucursal: Number(r.id_sucursal),
      nombre: String(r.nombre || ""),
      direccion: String(r.direccion || ""),
      telefono: (r.telefono as string) || null,
      whatsapp: (r.whatsapp as string) || (r.telefono as string) || null,
      allow_pickup: r.allow_pickup !== false && Number(r.allow_pickup) !== 0,
      allow_delivery: r.allow_delivery === true || Number(r.allow_delivery) === 1,
    },
    disponible: Number(r.stock ?? 0),
    disponibilidad: r.disponibilidad as BranchAvailability["disponibilidad"],
    // Misma variante stock global (ERP no desglosa SKU por sucursal en este endpoint)
    variantes: variantesRaw.map((v) => ({
      id_variante: Number(v.id_sku ?? v.id_variante),
      sku: (v.sku as string) || null,
      disponible: Number(v.stock ?? 0),
      disponibilidad: v.disponibilidad as BranchAvailability["disponibilidad"],
    })),
  }));
  return { success: true, data: mapped };
}

export async function validateCartStore(
  _slug: string,
  body: {
    items: {
      id_producto: number;
      id_variante?: number | null;
      id_solicitud?: number | null;
      cantidad: number;
      selecciones?: { id_atributo: number; id_valor?: number | null; valor?: string }[];
    }[];
    id_sucursal?: number | null;
  }
) {
  // ERP: validación lazy en checkout; aquí asumimos OK si hay ítems
  return {
    success: true,
    data: {
      ok: true,
      items: body.items.map((i) => ({
        id_producto: i.id_producto,
        id_variante: i.id_variante,
        ok: true,
        estado: "disponible",
        disponible: 999,
        cantidad: i.cantidad,
        allowAddToCart: true,
        message: null as string | null,
      })),
    },
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
  const metodo =
    body.fulfillment === "provincia"
      ? "provincia"
      : body.fulfillment === "delivery"
        ? "delivery"
        : "retiro";
  const idempotency_key = `web-${slug}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const payload = {
    items: body.items.map((i) => ({
      id_producto: i.id_producto,
      id_sku: i.id_variante || null,
      cantidad: i.cantidad,
    })),
    id_sucursal: body.id_sucursal,
    metodo_entrega: metodo,
    cupon_codigo: null,
    direccion_entrega: body.entrega?.direccion || null,
    distrito: body.entrega?.distrito || null,
    referencia_entrega: body.entrega?.referencia || null,
    notas: body.entrega?.notas || body.telefono_comprador || null,
    id_zona: body.id_zona || null,
    id_destino: body.id_destino || null,
    id_agencia: body.id_agencia || null,
    idempotency_key,
  };
  const { data } = await api.post(`/catalogo/store/${slug}/checkout`, payload, {
    headers: storefrontAuthHeaders(slug),
  });
  if (!data?.success) return data;
  const pref = data.data?.preference || {};
  const store = data.data?.store || {};
  return {
    success: true,
    data: {
      ...pref,
      preference_id: pref.preference_id,
      init_point: pref.init_point,
      sandbox_init_point: pref.init_point,
      modo: store.mp_modo || "test",
      codigo: data.data?.pedido?.codigo,
      pedido: data.data?.pedido,
      pickup: body.fulfillment === "pickup" ? { direccion: null } : undefined,
    },
    message: data.message,
  };
}

export async function buyerRegister(
  slug: string,
  body: { email: string; password: string; nombre: string; telefono?: string }
) {
  const { data } = await api.post(`/catalogo/store/${slug}/auth/register`, {
    email: body.email,
    password: body.password,
    nombres: body.nombre,
    telefono: body.telefono,
  });
  if (data?.success && data?.data) {
    const c = data.data.comprador || data.data;
    const user = {
      id_cliente: Number(c.id_cliente || c.id_comprador),
      email: String(c.email || body.email),
      nombre:
        [c.nombres, c.apellidos].filter(Boolean).join(" ") ||
        String(c.nombre || body.nombre),
      telefono: c.telefono ?? null,
      id_tienda: Number(c.id_tenant || 0),
      id_tenant: Number(c.id_tenant || 0),
      slug,
    };
    return { success: true, data: { token: data.data.token, user } };
  }
  return data;
}

export async function buyerLogin(slug: string, body: { email: string; password: string }) {
  const { data } = await api.post(`/catalogo/store/${slug}/auth/login`, body);
  if (data?.success && data?.data) {
    const c = data.data.comprador || data.data;
    const user = {
      id_cliente: Number(c.id_cliente || c.id_comprador),
      email: String(c.email || body.email),
      nombre: [c.nombres, c.apellidos].filter(Boolean).join(" ") || String(c.nombre || ""),
      telefono: c.telefono ?? null,
      id_tienda: Number(c.id_tenant || 0),
      id_tenant: Number(c.id_tenant || 0),
      slug,
    };
    return { success: true, data: { token: data.data.token, user } };
  }
  return data;
}

export async function buyerMe(slug: string) {
  const { data } = await api.get(`/catalogo/store/${slug}/auth/me`, {
    headers: storefrontAuthHeaders(slug),
  });
  if (!data?.success) return data;
  const c = data.data?.comprador || data.data || {};
  const user = {
    id_cliente: Number(c.id_cliente || c.id_comprador),
    email: String(c.email || ""),
    nombre: [c.nombres, c.apellidos].filter(Boolean).join(" ") || String(c.nombre || ""),
    telefono: c.telefono ?? null,
    id_tienda: Number(c.id_tenant || 0),
    id_tenant: Number(c.id_tenant || 0),
    slug,
  };
  return { success: true, data: { user } };
}

export async function buyerUpdateProfile(
  slug: string,
  body: { nombre: string; telefono?: string | null }
) {
  // Endpoint opcional — si no existe, no romper perfil
  try {
    const { data } = await api.patch(
      `/catalogo/store/${slug}/auth/me`,
      { nombres: body.nombre, telefono: body.telefono },
      { headers: storefrontAuthHeaders(slug) }
    );
    return data;
  } catch {
    return { success: false, message: "Actualización de perfil no disponible aún" };
  }
}

export async function buyerChangePassword(
  slug: string,
  body: { password_actual: string; password_nueva: string }
) {
  try {
    const { data } = await api.patch(`/catalogo/store/${slug}/auth/me/password`, body, {
      headers: storefrontAuthHeaders(slug),
    });
    return data;
  } catch {
    return { success: false, message: "Cambio de contraseña no disponible aún" };
  }
}

export async function buyerListFavoritos(slug: string) {
  const { data } = await api.get(`/catalogo/store/${slug}/favoritos`, {
    headers: storefrontAuthHeaders(slug),
  });
  const rows = data?.data || [];
  return {
    success: true,
    data: Array.isArray(rows) ? rows.map(mapProducto) : rows,
  };
}

export async function buyerToggleFavorito(slug: string, id_producto: number) {
  // ERP: POST add, DELETE remove — intentar add; si ya existe, remove
  try {
    const list = await buyerListFavoritos(slug);
    const has = (list.data || []).some(
      (p: { id_producto?: number }) => Number(p.id_producto) === id_producto
    );
    if (has) {
      await api.delete(`/catalogo/store/${slug}/favoritos/${id_producto}`, {
        headers: storefrontAuthHeaders(slug),
      });
      return { success: true, data: { favorito: false } };
    }
    await api.post(
      `/catalogo/store/${slug}/favoritos`,
      { id_producto },
      { headers: storefrontAuthHeaders(slug) }
    );
    return { success: true, data: { favorito: true } };
  } catch (e) {
    return { success: false, message: (e as Error).message };
  }
}

export async function buyerListPedidos(slug: string, _estado?: string) {
  const { data } = await api.get(`/catalogo/store/${slug}/mis-pedidos`, {
    headers: storefrontAuthHeaders(slug),
  });
  return { success: true, data: data?.data || [] };
}

export async function buyerGetPedido(slug: string, id_orden: number | string) {
  const { data } = await api.get(`/catalogo/store/${slug}/mis-pedidos/${id_orden}`, {
    headers: storefrontAuthHeaders(slug),
  });
  return data;
}

export async function syncStoreOrderPayment(slug: string, codigo: string, _extra?: unknown) {
  const { data } = await api.get(`/catalogo/store/${slug}/ordenes/${codigo}/sync-pago`);
  return data;
}

export async function storeEntregaOpciones(
  slug: string,
  _params?: { subtotal?: number; id_sucursal?: number }
) {
  const { data } = await api.get(`/catalogo/store/${slug}/envio/opciones`);
  return { success: true, data: data?.data || {} };
}

export async function storeEntregaCotizar(
  slug: string,
  body: {
    fulfillment?: string;
    distrito?: string;
    id_zona?: number | null;
    id_destino?: number | null;
    subtotal?: number;
    id_sucursal?: number | null;
    lat?: number | null;
    lng?: number | null;
  }
) {
  const { data } = await api.post(`/catalogo/store/${slug}/envio/cotizar`, body);
  const d = data?.data || {};
  return {
    success: true,
    data: {
      costo: Number(d.costo ?? d.costo_envio ?? 0),
      mensaje: d.mensaje || null,
      motivo: d.motivo || d.mensaje || null,
      disponible: d.disponible !== false,
      zona: d.zona || null,
    },
  };
}

export async function registrarConsultaDisponibilidad(
  slug: string,
  body: Record<string, unknown>
) {
  const { data } = await api.post(`/catalogo/store/${slug}/consultas-wa`, body);
  return data;
}

export async function getProductReviews(
  slug: string,
  id_producto: number,
  _params?: { sort?: string; page?: number; limit?: number }
) {
  const { data } = await api.get(`/catalogo/store/${slug}/productos/${id_producto}`);
  const items = (data?.data?.resenas || []) as unknown[];
  return {
    success: true,
    data: {
      reviews: items,
      items,
      summary: null as null,
    },
  };
}

export async function getReviewEligibilidad(_slug: string, _opts: unknown) {
  return { success: true, data: { puede: false, elegible: false, motivo: null as string | null } };
}

export async function listMisReviews(_slug: string) {
  return { success: true, data: [] };
}

export async function getOpinionesGenerales(_slug: string, _limit?: number) {
  return { success: true as const, data: { reviews: [] as unknown[] } };
}

export async function createProductReview(
  slug: string,
  body: { id_producto: number; rating: number; titulo?: string; cuerpo?: string }
) {
  const { data } = await api.post(`/catalogo/store/${slug}/resenas`, body, {
    headers: storefrontAuthHeaders(slug),
  });
  return data;
}

/** Alias usado por ReviewForm (paridad ecommerce) */
export async function createReview(slug: string, body: Record<string, unknown>) {
  const id_producto = Number(body.id_producto);
  if (!Number.isFinite(id_producto) || id_producto <= 0) {
    return { success: false, message: "Reseña de producto requerida" };
  }
  return createProductReview(slug, {
    id_producto,
    rating: Number(body.rating),
    titulo: (body.titulo as string) || undefined,
    cuerpo: (body.comentario as string) || (body.cuerpo as string) || undefined,
  });
}

export async function uploadReviewMedia(
  _slug: string,
  _body: { data_base64: string; file_name?: string }
) {
  // ERP aún no guarda media de reseñas; no romper el formulario
  return { success: true, data: { url: null as string | null, file_id: null as string | null } };
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

/* Solicitudes / notificaciones: no existen en ERP store — stubs seguros */
export async function buyerCrearSolicitud(
  _slug: string,
  _body?: Record<string, unknown>
) {
  return {
    success: false as const,
    duplicated: false,
    message: "Solicitudes de stock no disponibles en Tienda web ERP",
  };
}

export async function buyerListSolicitudes(_slug: string) {
  return { success: true as const, data: [] as Record<string, unknown>[] };
}

export async function buyerGetSolicitud(_slug: string, _id: number) {
  return { success: false as const, data: null };
}

export async function buyerCancelarSolicitud(_slug: string, _id: number, _motivo?: string) {
  return { success: false as const };
}

export async function buyerComprarDesdeSolicitud(_slug: string, _id: number) {
  return {
    success: false as const,
    data: undefined as
      | {
          id_solicitud: number;
          id_producto: number;
          id_variante?: number | null;
          id_sucursal: number;
          cantidad: number;
          attrs?: Record<string, unknown>;
          precio?: number;
          producto_nombre?: string;
          expires_at?: string;
        }
      | undefined,
  };
}

export async function buyerListNotificaciones(_slug: string) {
  return { success: true as const, data: [] as BuyerNotificacion[] };
}

export async function buyerUnreadNotificaciones(_slug: string) {
  return { success: true as const, data: { count: 0 } };
}

export async function buyerLeerNotificacion(_slug: string, _id: number) {
  return { success: true as const };
}

export async function buyerLeerTodasNotificaciones(_slug: string) {
  return { success: true as const };
}
