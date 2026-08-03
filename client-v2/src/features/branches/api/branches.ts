import api from "@/api/axios";
import { isOk, unwrapList } from "@/api/http";
import type { Sucursal, Vendedor, SucursalInput } from "../types";

export const getSucursales = async (): Promise<Sucursal[]> => {
  const list = await unwrapList<Sucursal>(await api.get("/sucursales/"));
  return list.map((item) => ({
    ...item,
    id_sucursal: item.id_sucursal ?? (item as any).id,
  }));
};

export const getVendedores = async (): Promise<Vendedor[]> =>
  unwrapList<Vendedor>(await api.get("/sucursales/vendedores"));

export const createSucursal = async (input: SucursalInput): Promise<boolean> =>
  isOk(
    await api.post("/sucursales/addsucursal", {
      dni: input.dni,
      nombre_sucursal: input.nombre_sucursal.trim(),
      ubicacion: input.ubicacion.trim(),
      estado_sucursal: input.estado_sucursal ?? 1,
    })
  );

export const updateSucursal = async (input: SucursalInput): Promise<boolean> =>
  isOk(
    await api.post("/sucursales/updatesucursal", {
      id: input.id,
      dni: input.dni,
      nombre_sucursal: input.nombre_sucursal.trim(),
      ubicacion: input.ubicacion.trim(),
      estado_sucursal: input.estado_sucursal ?? 1,
    })
  );

export const deleteSucursal = async (id: number): Promise<boolean> =>
  isOk(await api.delete(`/sucursales/delete/${id}`));

/** Baja/alta reversible: `updatesucursal` hace UPDATE parcial por campos presentes, así que alcanza con id + estado. */
export const setSucursalEstado = async (id: number, estado_sucursal: number): Promise<boolean> =>
  isOk(await api.post("/sucursales/updatesucursal", { id, estado_sucursal }));

/**
 * Reasigna el vendedor responsable de una sucursal. Es la misma operación que
 * ya usa BranchForm.tsx (`dni` en `updatesucursal`), expuesta acá para poder
 * cambiar la sucursal de un empleado desde su propia ficha en vez de tener
 * que ir al módulo de Sucursales y editarla desde ahí.
 */
export const setSucursalVendedor = async (id_sucursal: number, dni: string): Promise<boolean> =>
  isOk(await api.post("/sucursales/updatesucursal", { id: id_sucursal, dni }));
