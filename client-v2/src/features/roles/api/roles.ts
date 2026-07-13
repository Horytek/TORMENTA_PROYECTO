import api from "@/api/axios";
import { isOk, unwrapList } from "@/api/http";
import type { Rol, RolInput } from "../types";

export const getRoles = async (): Promise<Rol[]> =>
  unwrapList<Rol>(await api.get("/rol"));

export const createRol = async (input: RolInput): Promise<boolean> =>
  isOk(await api.post("/rol", { nom_rol: input.nom_rol.trim(), estado_rol: input.estado_rol }));

export const updateRol = async (id: number, input: RolInput): Promise<boolean> =>
  isOk(await api.put(`/rol/${id}`, { nom_rol: input.nom_rol.trim(), estado_rol: input.estado_rol }));

export const deleteRol = async (id: number): Promise<boolean> =>
  isOk(await api.delete(`/rol/${id}`));
