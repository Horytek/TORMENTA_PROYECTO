import api from "@/api/axios";
import { isOk, unwrapList } from "@/api/http";
import type { Almacen, SucursalOption, AlmacenInput } from "../types";

export const getAlmacenes = async (): Promise<Almacen[]> =>
  unwrapList<Almacen>(await api.get("/almacen"));

export const getSucursalesDisponibles = async (): Promise<SucursalOption[]> =>
  unwrapList<SucursalOption>(await api.get("/almacen/sucursales"));

const body = (input: AlmacenInput) => ({
  nom_almacen: input.nom_almacen.trim(),
  ubicacion: input.ubicacion.trim(),
  id_sucursal: input.id_sucursal,
  estado_almacen: input.estado_almacen ?? 1,
});

export const createAlmacen = async (input: AlmacenInput): Promise<boolean> =>
  isOk(await api.post("/almacen", body(input)));

export const updateAlmacen = async (input: AlmacenInput): Promise<boolean> =>
  isOk(await api.put(`/almacen/${input.id}`, body(input)));

export const deleteAlmacen = async (id: number): Promise<boolean> =>
  isOk(await api.delete(`/almacen/${id}`));
