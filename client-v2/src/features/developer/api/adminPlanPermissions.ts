import api from "@/api/axios";
import type { RouteModule } from "@/api/rutas";

/** id_rol reservado para el Administrador/titular de cada empresa — mismo valor en toda la BD (ver ADMIN_ROLE_ID en usePermissions.ts). */
export const ADMIN_ROLE_ID = 1;

export interface AdminPermisoRow {
  id_modulo: number;
  id_submodulo: number | null;
  ver: number;
  crear: number;
  editar: number;
  eliminar: number;
  desactivar: number;
  generar: number;
}

/** Catálogo (módulos+submódulos+metadata) filtrado por los entitlements de un plan arbitrario. */
export const getCatalogByPlan = async (planId: number): Promise<RouteModule[]> => {
  const res = await api.get(`/authz/catalog-by-plan/${planId}`);
  return res.data?.data ?? [];
};

/** Permisos del Administrador ya empujados a todos los tenants de ese plan (agregados, agrupados por módulo/submódulo). */
export const getAdminPermisosByPlan = async (planId: number): Promise<AdminPermisoRow[]> => {
  const res = await api.get(`/permisos-globales/permisos-rol/${ADMIN_ROLE_ID}`, { params: { plan: planId } });
  return res.data?.data ?? [];
};

/** Empuja el set completo de permisos del Administrador a todos los tenants de ese plan (borra y reinserta, no toca overrides de tenant). */
export const saveAdminPermisosByPlan = async (planId: number, permisos: AdminPermisoRow[]): Promise<boolean> => {
  const res = await api.post("/permisos-globales/save-global", {
    id_rol: ADMIN_ROLE_ID,
    plan_seleccionado: planId,
    permisos,
  });
  return !!res.data?.success;
};
