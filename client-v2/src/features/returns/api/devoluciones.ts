// ─────────────────────────────────────────────────────────────────
// API — Devoluciones
//
// ⚠️ CONTRATO PENDIENTE DE BACKEND. Estos endpoints todavía NO existen en
// src/routes (verificado: no hay devoluciones.routes.js). El backend debe
// implementarlos con esta forma, siguiendo el estándar { success, data } y
// las REGLAS DE ORO (filtro por id_tenant, SQL parametrizado, transacción
// venta↔devolución↔kardex):
//
//   GET    /devoluciones                → lista con filtros (estado, sucursal, fechas, q)
//   GET    /devoluciones/:id            → detalle completo (items + historial)
//   GET    /devoluciones/por_venta/:id  → devoluciones previas de una venta
//   POST   /devoluciones                → crear (payload DevolucionPayload)
//   PATCH  /devoluciones/:id/estado     → transición de estado { estado, nota }
//   POST   /devoluciones/:id/reembolso  → procesar reembolso { metodo }   (idempotente)
//
// La búsqueda de la venta original reutiliza los endpoints reales de ventas
// (features/sales/api/ventas.ts): GET /ventas y GET /ventas/venta_boucher.
// ─────────────────────────────────────────────────────────────────
import api from "@/api/axios";
import type {
  Devolucion,
  DevolucionEstado,
  DevolucionFilters,
  DevolucionPayload,
} from "../types";

export const getDevoluciones = async (filters?: DevolucionFilters): Promise<Devolucion[]> => {
  const params = {
    ...filters,
    estado: Array.isArray(filters?.estado) ? filters.estado.join(",") : filters?.estado,
  };
  const response = await api.get("/devoluciones", { params });
  return response.data?.data ?? [];
};

export const getDevolucion = async (id: number): Promise<Devolucion> => {
  const response = await api.get(`/devoluciones/${id}`);
  return response.data?.data ?? response.data;
};

export const getDevolucionesByVenta = async (idVenta: number): Promise<Devolucion[]> => {
  const response = await api.get(`/devoluciones/por_venta/${idVenta}`);
  return response.data?.data ?? [];
};

export const createDevolucion = async (
  payload: DevolucionPayload
): Promise<{ success: boolean; id_devolucion?: number; codigo?: string; message?: string }> => {
  const response = await api.post("/devoluciones", payload);
  return response.data;
};

export const cambiarEstadoDevolucion = async (
  id: number,
  cambio: { estado: DevolucionEstado; nota?: string }
): Promise<{ success: boolean; message?: string }> => {
  const response = await api.patch(`/devoluciones/${id}/estado`, cambio);
  return response.data;
};

export const procesarReembolso = async (
  id: number,
  datos: { metodo: string }
): Promise<{ success: boolean; message?: string }> => {
  const response = await api.post(`/devoluciones/${id}/reembolso`, datos);
  return response.data;
};
