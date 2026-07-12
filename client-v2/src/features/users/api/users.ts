import api from "@/api/axios";
import { isOk, unwrapList } from "@/api/http";
import type { Usuario, Rol, UsuarioInput } from "../types";

export const getUsuarios = async (): Promise<Usuario[]> =>
  unwrapList<Usuario>(await api.get("/usuario", { params: { limit: 100, page: 1 } }));

export const getRoles = async (): Promise<Rol[]> =>
  unwrapList<Rol>(await api.get("/rol"));

export const createUsuario = async (input: UsuarioInput): Promise<boolean> =>
  isOk(
    await api.post("/usuario", {
      id_rol: input.id_rol,
      usua: input.usua.trim(),
      contra: input.contra,
      estado_usuario: input.estado_usuario,
      ...(input.id_empresa != null ? { id_empresa: input.id_empresa } : {}),
    })
  );

/** Actualización parcial: solo envía los campos presentes. `contra` solo si se ingresó una nueva. */
export const updateUsuario = async (id: number, input: Partial<UsuarioInput>): Promise<boolean> => {
  const body: Record<string, unknown> = {};
  if (input.usua !== undefined) body.usua = input.usua.trim();
  if (input.id_rol !== undefined) body.id_rol = input.id_rol;
  if (input.estado_usuario !== undefined) body.estado_usuario = input.estado_usuario;
  if (input.contra) body.contra = input.contra;
  return isOk(await api.put(`/usuario/${id}`, body));
};

export const deleteUsuario = async (id: number): Promise<boolean> =>
  isOk(await api.delete(`/usuario/${id}`));
