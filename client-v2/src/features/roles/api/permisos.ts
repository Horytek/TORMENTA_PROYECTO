import api from "@/api/axios";
import { isOk, unwrapList } from "@/api/http";

/** Fila de permiso por módulo/submódulo para un rol. */
export interface PermisoRow {
  id_modulo: number;
  id_submodulo: number | null;
  ver: number;
  crear: number;
  editar: number;
  eliminar: number;
  desactivar: number;
  generar: number;
}

export const getPermisosByRol = async (idRol: number): Promise<PermisoRow[]> =>
  unwrapList<PermisoRow>(await api.get(`/permisos/roles/${idRol}`));

/** Guarda el set completo de permisos del rol (el backend borra y reinserta). */
export const savePermisos = async (idRol: number, permisos: PermisoRow[]): Promise<boolean> =>
  isOk(await api.post("/permisos/save", { id_rol: idRol, permisos }));
