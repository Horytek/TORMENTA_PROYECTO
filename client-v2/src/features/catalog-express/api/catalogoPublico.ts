import api from "@/api/axios";
import type { CatalogoPublico, Comprador, ProductoDetalle } from "../types";

const normalizeProductos = (list: unknown[]) =>
  (list ?? []).map((raw) => {
    const p = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
    return {
      ...p,
      precio: Number(p.precio),
      stock: Number(p.stock ?? 0),
    };
  });

export const getCatalogoPublico = async (idTenant: string | number): Promise<CatalogoPublico | null> => {
  const response = await api.get(`/catalogo/${idTenant}`);
  if (response.data?.code !== 1 && !response.data?.success) return null;
  const data = response.data.data;
  return {
    ...data,
    productos: normalizeProductos(data.productos) as CatalogoPublico["productos"],
    destacados: normalizeProductos(data.destacados || []) as CatalogoPublico["productos"],
    mas_vendidos: normalizeProductos(data.mas_vendidos || []) as CatalogoPublico["productos"],
  };
};

export const getStoreBySlug = async (slug: string): Promise<CatalogoPublico | null> => {
  const response = await api.get(`/catalogo/store/${slug}`);
  if (!response.data?.success && response.data?.code !== 1) return null;
  const data = response.data.data;
  return {
    ...data,
    productos: normalizeProductos(data.productos) as CatalogoPublico["productos"],
    destacados: normalizeProductos(data.destacados || []) as CatalogoPublico["productos"],
    mas_vendidos: normalizeProductos(data.mas_vendidos || []) as CatalogoPublico["productos"],
  };
};

export const getProductosPaginados = async (
  slug: string,
  params: Record<string, string | number | undefined>
) => {
  const response = await api.get(`/catalogo/store/${slug}/productos`, { params });
  return response.data?.data;
};

export const getProductoDetalle = async (
  slug: string,
  id: string | number,
  id_sucursal?: number
): Promise<{ producto: ProductoDetalle; relacionados: CatalogoPublico["productos"]; resenas: unknown[] } | null> => {
  const response = await api.get(`/catalogo/store/${slug}/productos/${id}`, {
    params: id_sucursal ? { id_sucursal } : undefined,
  });
  if (!response.data?.success) return null;
  const data = response.data.data;
  return {
    producto: {
      ...data.producto,
      precio: Number(data.producto.precio),
      variantes: (data.producto.variantes || []).map((v: Record<string, unknown>) => ({
        ...v,
        precio: Number(v.precio),
        stock: Number(v.stock),
      })),
    },
    relacionados: normalizeProductos(data.relacionados || []) as CatalogoPublico["productos"],
    resenas: data.resenas || [],
  };
};

export const logConsultaWa = async (
  slug: string,
  body: { id_producto?: number; id_sku?: number; id_sucursal?: number; origen?: string; attrs_snapshot?: unknown }
) => {
  const response = await api.post(`/catalogo/store/${slug}/consultas-wa`, body);
  return response.data?.data;
};

export const registerBuyer = async (
  slug: string,
  body: { email: string; password: string; nombres: string; apellidos?: string; telefono?: string; documento?: string }
) => {
  const response = await api.post(`/catalogo/store/${slug}/auth/register`, body);
  return response.data?.data as { token: string; comprador: Comprador };
};

export const loginBuyer = async (slug: string, body: { email: string; password: string }) => {
  const response = await api.post(`/catalogo/store/${slug}/auth/login`, body);
  return response.data?.data as { token: string; comprador: Comprador };
};

export const checkoutPedido = async (
  slug: string,
  body: Record<string, unknown>,
  token: string
) => {
  const response = await api.post(`/catalogo/store/${slug}/checkout`, body, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data?.data;
};

export const validarCupon = async (slug: string, codigo: string, subtotal: number) => {
  const response = await api.post(`/catalogo/store/${slug}/cupon/validar`, { codigo, subtotal });
  return response.data?.data;
};

export const cotizarEnvio = async (slug: string, distrito: string) => {
  const response = await api.post(`/catalogo/store/${slug}/envio/cotizar`, { distrito });
  return response.data?.data;
};

export const getFavoritos = async (slug: string, token: string) => {
  const response = await api.get(`/catalogo/store/${slug}/favoritos`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data?.data;
};

export const addFavorito = async (slug: string, id_producto: number, token: string) => {
  await api.post(
    `/catalogo/store/${slug}/favoritos`,
    { id_producto },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};

export const removeFavorito = async (slug: string, id_producto: number, token: string) => {
  await api.delete(`/catalogo/store/${slug}/favoritos/${id_producto}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const getMisPedidos = async (slug: string, token: string) => {
  const response = await api.get(`/catalogo/store/${slug}/mis-pedidos`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data?.data;
};

export const syncPago = async (slug: string, codigo: string) => {
  const response = await api.get(`/catalogo/store/${slug}/ordenes/${codigo}/sync-pago`);
  return response.data?.data;
};

export const crearResena = async (
  slug: string,
  body: { id_producto: number; rating: number; titulo?: string; cuerpo?: string },
  token: string
) => {
  const response = await api.post(`/catalogo/store/${slug}/resenas`, body, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data?.data;
};

// Admin
export const adminGetTiendaConfig = async () => {
  const response = await api.get("/catalogo/admin/config");
  return response.data?.data;
};

export const adminPatchTiendaConfig = async (body: Record<string, unknown>) => {
  const response = await api.patch("/catalogo/admin/config", body);
  return response.data?.data;
};

export const adminListPedidos = async (params?: {
  estado?: string;
  mp_status?: string;
}) => {
  const response = await api.get("/catalogo/admin/pedidos", { params });
  return response.data?.data;
};

export const adminUpdatePedidoEstado = async (id: number, estado: string) => {
  await api.patch(`/catalogo/admin/pedidos/${id}/estado`, { estado });
};

export const adminValidarPickup = async (body: { token?: string; codigo?: string }) => {
  const response = await api.post("/catalogo/admin/pickup/validar", body);
  return response.data?.data;
};

export const adminCupones = async () => {
  const response = await api.get("/catalogo/admin/cupones");
  return response.data?.data;
};

export const adminSaveCupon = async (body: Record<string, unknown>) => {
  const response = await api.post("/catalogo/admin/cupones", body);
  return response.data?.data;
};

export const adminEntrega = async () => {
  const response = await api.get("/catalogo/admin/entrega");
  return response.data?.data;
};

export const adminSaveEntrega = async (body: Record<string, unknown>) => {
  await api.post("/catalogo/admin/entrega", body);
};

export const adminBanners = async () => {
  const response = await api.get("/catalogo/admin/banners");
  return response.data?.data;
};

export const adminSaveBanner = async (body: Record<string, unknown>) => {
  await api.post("/catalogo/admin/banners", body);
};

export const adminResenas = async (params?: { estado?: string; q?: string }) => {
  const response = await api.get("/catalogo/admin/resenas", { params });
  return response.data?.data;
};

export const adminResenaStats = async () => {
  const response = await api.get("/catalogo/admin/resenas/stats");
  return response.data?.data;
};

export const adminGetResenaConfig = async () => {
  const response = await api.get("/catalogo/admin/resenas/config");
  return response.data?.data;
};

export const adminPatchResenaConfig = async (body: Record<string, unknown>) => {
  const response = await api.patch("/catalogo/admin/resenas/config", body);
  return response.data?.data;
};

export const adminModerarResena = async (id: number, body: Record<string, unknown>) => {
  await api.patch(`/catalogo/admin/resenas/${id}`, body);
};

export const adminPatchSucursal = async (id: number, body: Record<string, unknown>) => {
  const response = await api.patch(`/catalogo/admin/sucursales/${id}`, body);
  return response.data?.data;
};

export const adminListSucursales = async () => {
  const response = await api.get("/catalogo/admin/sucursales");
  return response.data?.data;
};

export const adminUploadTiendaBrand = async (
  kind: "logo" | "banner",
  file: string,
  fileName?: string
) => {
  const response = await api.post(`/catalogo/admin/tienda/${kind}`, { file, fileName });
  return response.data;
};

export const adminConsultasStats = async () => {
  const response = await api.get("/catalogo/admin/consultas");
  return response.data?.data;
};

export const adminPatchDisponibilidad = async (disponibilidad: Record<string, unknown>) => {
  const response = await api.patch("/catalogo/admin/config", { disponibilidad });
  return response.data?.data;
};
