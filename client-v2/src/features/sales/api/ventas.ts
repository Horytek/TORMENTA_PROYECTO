import api from "@/api/axios";
import type {
  Venta,
  VentaPayload,
  VentasFilters,
  POSProduct,
  CreateVentaResponse,
  ComprobanteTipo,
} from "../types";
import { mapBackendVenta } from "../types";

// ── Catálogo de productos para POS ───────────────────────────
export const getProductosVentas = async (params?: {
  id_sucursal?: number | string;
  id_almacen?: number | string;
}): Promise<POSProduct[]> => {
  const response = await api.get("/ventas/producto_venta", { params });
  const data = response.data;
  return data?.data || [];
};

// ── Lista de ventas con filtros ───────────────────────────────
export const getVentas = async (filters?: VentasFilters): Promise<Venta[]> => {
  const response = await api.get("/ventas", { params: filters });
  const data = response.data;
  const raw: Record<string, unknown>[] = data?.data || data || [];
  // mapBackendVenta normaliza los nombres del backend a los aliases del type Venta
  return raw.map(mapBackendVenta);
};

// ── Detalle de venta por ID ──────────────────────────────────
export const getVentaById = async (id: number): Promise<Venta> => {
  const response = await api.get(`/ventas/venta_boucher`, { params: { id_venta: id } });
  const data = response.data;
  return data?.data || data;
};

// ── Crear venta ───────────────────────────────────────────────
export const createVenta = async (payload: VentaPayload): Promise<CreateVentaResponse> => {
  const response = await api.post("/ventas/agregar_venta", payload);
  const data = response.data;
  return {
    success: data?.code === 1 || data?.success === true,
    id_venta: data?.id_venta || data?.id,
    num_comprobante: data?.num_comprobante,
    message: data?.message,
    estado_sunat: data?.estado_sunat,
    venta: data?.venta,
  };
};

// ── Anular venta ─────────────────────────────────────────────
export const annulVenta = async (
  idVenta: number,
  estadoSunat?: string,
  comprobante?: string
): Promise<boolean> => {
  // Route: POST /ventas/eliminar_venta
  const response = await api.post("/ventas/eliminar_venta", {
    id_venta: idVenta,
    estado_sunat: estadoSunat,
    comprobante,
  });
  const data = response.data;
  return data?.code === 1 || data?.success === true;
};

// ── Actualizar estado venta (anular/activar) ─────────────────
export const updateVentaEstado = async (
  idVenta: number,
  estado: number
): Promise<boolean> => {
  const response = await api.post("/ventas/actualizar_venta", {
    id_venta: idVenta,
    estado_venta: estado,
  });
  const data = response.data;
  return data?.code === 1 || data?.success === true;
};

// ── Correlativo siguiente ─────────────────────────────────────
export const getNextComprobante = async (
  idComprobante: ComprobanteTipo,
  idSucursal: number
): Promise<string> => {
  const response = await api.get("/ventas/numero_comprobante", {
    params: { id_comprobante: idComprobante, id_sucursal: idSucursal },
  });
  const data = response.data;
  return data?.data || data?.num_comprobante || "";
};

// ── Obtener tipos de comprobante ───────────────────────────────
export const getTiposComprobante = async (): Promise<{ id: number; nombre: string }[]> => {
  const response = await api.get("/ventas/comprobante");
  const data = response.data;
  return data?.data || data || [];
};

// ── Última venta ─────────────────────────────────────────────
export const getLastVenta = async (): Promise<Venta | null> => {
  const response = await api.get("/ventas/last_venta");
  const data = response.data;
  return data?.data || data || null;
};

// ── Clientes para venta (autocomplete) ───────────────────────
export const getClientesForVenta = async (q?: string): Promise<unknown[]> => {
  // Reuse existing clientes endpoint with search
  const response = await api.get("/clientes", {
    params: q ? { q } : {},
  });
  const data = response.data;
  return data?.data || data || [];
};
