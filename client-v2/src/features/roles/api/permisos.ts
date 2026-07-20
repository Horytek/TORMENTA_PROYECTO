import api from "@/api/axios";
import { isOk, unwrapList } from "@/api/http";
import { getEffectivePermissions, type EffectivePermissions, type PermissionSource } from "@/api/authz";

export { getEffectivePermissions, type EffectivePermissions, type PermissionSource };

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
  /** Acciones dinámicas (`{ "anular_venta": 1 }`) fuera de las 6 estándar. El
   *  backend ya la persiste y el resolver la convierte en capabilities
   *  `slug.accion`; se round-trippea para no borrarla al editar los permisos
   *  estándar. Puede venir como objeto o string JSON según el driver. */
  actions_json?: Record<string, number> | string | null;
}

export const getPermisosByRol = async (idRol: number): Promise<PermisoRow[]> =>
  unwrapList<PermisoRow>(await api.get(`/permisos/roles/${idRol}`));

/** Guarda el set completo de permisos del rol (el backend borra y reinserta). */
export const savePermisos = async (idRol: number, permisos: PermisoRow[]): Promise<boolean> =>
  isOk(await api.post("/permisos/save", { id_rol: idRol, permisos }));
